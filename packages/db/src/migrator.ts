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
  operationalDatabase,
  databaseConfig,
  dev = {
    developmentMode: false,
  },
  runFixtures,
}: {
  schema: T
  operationalDatabase: string
  databaseConfig: {
    database: string
    secretArn: string
    resourceArn: string
  }
  dev?: {
    connectionString?: string
    developmentMode: boolean
  }
  runFixtures?: (result: MigrationResult) => Promise<void>
}) {
  const getDatabasePool = getDatabasePoolHandler({
    schema,
    databaseConfig,
    dev,
  })

  const retryMigration = async (
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
        await getDatabasePool(async (targetDb) => {
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
    const appDatabase = databaseConfig.database
    await createDatabaseIfNotExists(operationalDatabase, appDatabase)
    const migrationResult = await retryMigration()
    if (runFixtures) {
      await runFixtures(migrationResult)
    }
    return migrationResult
  }
}
