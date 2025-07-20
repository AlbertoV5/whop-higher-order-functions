import type { PgSchema, PgTableWithColumns } from "drizzle-orm/pg-core"
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres"
import { drizzle } from "drizzle-orm/aws-data-api/pg"
import type { Relations } from "drizzle-orm"
import { rdsClient } from "./client"
import { Pool } from "pg"

export function getDatabaseConnectionHandler<
  T extends Record<string, PgTableWithColumns<any> | PgSchema | Relations>
>({
  schema,
  databaseConfig,
  dev = {
    connectionString: "",
    developmentMode: false,
  },
}: {
  schema: T
  databaseConfig: {
    database: string
    secretArn: string
    resourceArn: string
  }
  dev?: {
    connectionString?: string
    developmentMode: boolean
  }
}) {
  const { connectionString, developmentMode } = dev
  return (dbName?: string) => {
    if (!developmentMode) {
      // Use Aurora in production
      return drizzle(rdsClient, {
        ...databaseConfig,
        database: dbName || databaseConfig.database,
        schema,
      })
    } else {
      // Use node-postgres with pooling in non-production
      if (!connectionString) {
        throw new Error("connectionString is required in development mode")
      }
      const pool = new Pool({
        connectionString,
      })
      return drizzleNodePg(pool, { schema })
    }
  }
}
