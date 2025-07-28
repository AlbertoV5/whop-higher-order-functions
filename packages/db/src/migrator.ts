import type { PgSchema, PgTableWithColumns } from "drizzle-orm/pg-core"
import { getDatabasePoolHandler } from "./pool"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { Relations, sql } from "drizzle-orm"
import { existsSync } from "fs"
import { join } from "path"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type MigrationResult = {
  statusCode: 200 | 500
  body: string
}

export function getMigratorHandler<
  T extends Record<string, PgTableWithColumns<any> | PgSchema | Relations>
>({
  schema,
  databaseConfig,
  operationalDatabase = "postgres",
  dev = {
    developmentMode: false,
  },
  onSuccess,
  onError,
}: {
  schema: T
  databaseConfig: {
    database: string
    secretArn: string
    resourceArn: string
  }
  /** Name of the database to use for creating the app's database. Defaults to "postgres". */
  operationalDatabase?: string
  dev?: {
    connectionString?: string
    developmentMode: boolean
  }
  /**
   * A function to run after the migration is complete.
   * Use it to seed or create fixtures in the app's database.
   * @param status - The status of the migration.
   * @param withDatabasePool - A function to get a database pool.
   */
  onSuccess?: (props: {
    schema: T
    withDatabasePool: ReturnType<typeof getDatabasePoolHandler>
  }) => Promise<void>
  onError?: (props: {
    schema: T
    error: Error
    withDatabasePool: ReturnType<typeof getDatabasePoolHandler>
  }) => Promise<void>
}) {
  const withDatabasePool = getDatabasePoolHandler({
    schema,
    databaseConfig,
    dev,
  })

  const migrateWithRetry = async (
    maxRetries = 5,
    baseDelay = 2000
  ): Promise<MigrationResult> => {
    // Check if migrations folder exists
    const migrationsPath = "./migrations"
    if (!existsSync(migrationsPath)) {
      console.log("No migrations to run")
      return {
        statusCode: 200,
        body: "No migrations to run",
      }
    }

    // Check if meta/_journal.json exists
    const journalPath = join(migrationsPath, "meta", "_journal.json")
    if (!existsSync(journalPath)) {
      console.log("No migrations to run")
      return {
        statusCode: 200,
        body: "No migrations to run",
      }
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await withDatabasePool(async (targetDb) => {
          await migrate(targetDb, {
            migrationsFolder: "./migrations",
          })
        })
        console.log("Migration completed successfully")
        return {
          statusCode: 200,
          body: "Migration completed successfully",
        }
      } catch (error: any) {
        const isDatabaseResuming =
          error?.message?.includes("DatabaseResumingException") ||
          error?.message?.includes("is resuming after being auto-paused")

        if (isDatabaseResuming && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
          console.log(
            `Database is resuming (attempt ${attempt}/${maxRetries}). Waiting ${delay}ms before retry...`
          )
          await sleep(delay)
          continue
        }
        // If it's not a resuming exception or we've exhausted retries, throw the error
        console.error(`Migration failed after ${attempt} attempts:`, error)
        throw error
      }
    }
    return {
      statusCode: 500,
      body: "Migration failed after 5 attempts",
    }
  }

  const createDatabaseIfNotExists = async (
    operationalDatabase: string,
    appDatabase: string
  ) => {
    // Create a separate pool handler for the operational database
    const getOperationalDatabasePool = getDatabasePoolHandler({
      schema,
      databaseConfig: {
        ...databaseConfig,
        database: operationalDatabase,
      },
      dev,
    })

    try {
      await getOperationalDatabasePool(async (mainDb) => {
        // Check if database already exists
        const result = await mainDb.execute(
          sql.raw(`SELECT 1 FROM pg_database WHERE datname = '${appDatabase}'`)
        )
        if (result.rows.length === 0) {
          // Database doesn't exist, create it
          await mainDb.execute(sql.raw(`CREATE DATABASE "${appDatabase}"`))
          console.log(`✅ Created database: ${appDatabase}`)
        } else {
          console.log(`📋 Database ${appDatabase} already exists`)
        }
      })
    } catch (error: any) {
      console.error(
        `⚠️  Error checking/creating database ${appDatabase}:`,
        error.message
      )
      throw error
    }
  }
  return async (): Promise<MigrationResult> => {
    await createDatabaseIfNotExists(
      operationalDatabase,
      databaseConfig.database
    )
    const migrationResult = await migrateWithRetry()
    if (onSuccess && migrationResult.statusCode === 200) {
      await onSuccess({
        schema,
        withDatabasePool,
      })
    } else if (onError && migrationResult.statusCode === 500) {
      await onError({
        schema,
        error: new Error(migrationResult.body),
        withDatabasePool,
      })
    }
    return migrationResult
  }
}
