import type { PgSchema, PgTableWithColumns } from "drizzle-orm/pg-core"
import { getDatabaseConnectionHandler } from "./connection"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { Relations, sql } from "drizzle-orm"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function getMigratorHandler<
  T extends Record<string, PgTableWithColumns<any> | PgSchema | Relations>
>({
  schema,
  operationalDatabase,
  databaseConfig,
}: {
  schema: T
  operationalDatabase: string
  databaseConfig: {
    database: string
    secretArn: string
    resourceArn: string
  }
}) {
  const getDatabase = getDatabaseConnectionHandler({
    schema,
    databaseConfig,
  })
  const retryMigration = async (maxRetries = 5, baseDelay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const targetDb = getDatabase()
        await migrate(targetDb, {
          migrationsFolder: "./migrations",
        })
        console.log("Migration completed successfully")
        return
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
  }
  const createDatabaseIfNotExists = async (
    operationalDatabase: string,
    appDatabase: string
  ) => {
    const mainDb = getDatabase(operationalDatabase)
    try {
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
    } catch (error: any) {
      console.error(
        `⚠️  Error checking/creating database ${appDatabase}:`,
        error.message
      )
      throw error
    }
  }
  return async () => {
    const appDatabase = databaseConfig.database
    await createDatabaseIfNotExists(operationalDatabase, appDatabase)
    await retryMigration()
    return {
      statusCode: 200,
      body: "Migration completed successfully",
    }
  }
}
