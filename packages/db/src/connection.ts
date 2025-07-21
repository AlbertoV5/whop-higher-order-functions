import type { PgSchema, PgTableWithColumns } from "drizzle-orm/pg-core"
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres"
import { drizzle } from "drizzle-orm/aws-data-api/pg"
import type { Relations } from "drizzle-orm"
import { rdsClient } from "./client"
import { Pool } from "pg"
import { withAuroraRetry } from "./utils"

export function getDatabaseConnectionHandler<
  T extends Record<string, PgTableWithColumns<any> | PgSchema | Relations>
>({
  schema,
  databaseConfig,
  dev = {
    connectionString: "",
    developmentMode: false,
  },
  enableRetry = true,
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
  enableRetry?: boolean
}) {
  const { connectionString, developmentMode } = dev
  return (dbName?: string) => {
    const baseDb = (() => {
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
    })()

    // If retry is disabled or in development mode, return the base database
    if (!enableRetry || developmentMode) {
      return baseDb
    }

    // Wrap with retry logic using Proxy
    return new Proxy(baseDb, {
      get(target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver)

        // If it's a method that returns a promise (database operations), wrap with retry
        if (typeof original === "function") {
          return function (...args: any[]) {
            const result = original.apply(target, args)

            // Check if the result is a promise (async database operation)
            if (result && typeof result.then === "function") {
              return withAuroraRetry(() => result, `database.${String(prop)}`)
            }

            return result
          }
        }

        return original
      },
    })
  }
}
