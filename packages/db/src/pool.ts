import { AwsDataApiPgDatabase, drizzle } from "drizzle-orm/aws-data-api/pg"
import type { DrizzleAwsDataApiPgConfig } from "drizzle-orm/aws-data-api/pg/driver"
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres"
import type { PgSchema, PgTableWithColumns } from "drizzle-orm/pg-core"
import { Pool } from "pg"
import { withAuroraRetry } from "./utils"
import { rdsClient } from "./client"
import type { Relations } from "drizzle-orm"

export function getDatabasePoolHandler<
  T extends Record<string, PgTableWithColumns<any> | PgSchema | Relations>
>({
  schema,
  databaseConfig,
  dev = {
    developmentMode: false,
  },
}: {
  schema: T
  databaseConfig: {
    database: string
    secretArn: string
    resourceArn: string
  } & DrizzleAwsDataApiPgConfig<T>
  dev: {
    connectionString?: string
    developmentMode: boolean
  }
}) {
  const { connectionString, developmentMode } = dev
  return async <
    Action extends (client: AwsDataApiPgDatabase<T>) => Promise<unknown>
  >(
    action: Action
  ): Promise<Awaited<ReturnType<Action>>> => {
    const result = await withAuroraRetry(async () => {
      if (!developmentMode) {
        const db = drizzle(rdsClient, { ...databaseConfig, schema })
        return await action(db)
      } else {
        if (!connectionString) {
          throw new Error("connectionString is required in development mode")
        }
        // Use node-postgres with pooling in non-production
        const pool = new Pool({ connectionString })
        const client = drizzleNodePg(pool, { schema, logger: false })
        try {
          const result = await action(client as any)
          await pool.end()
          return result
        } catch (e) {
          await pool.end()
          throw e
        }
      }
    }, "withDatabasePool")
    return result as Awaited<ReturnType<Action>>
  }
}
