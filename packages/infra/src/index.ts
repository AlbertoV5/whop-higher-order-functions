// @ts-nocheck
// This library provides factory functions for creating SST apps with consistent patterns
export interface AppConfig {
  name: string
  path: string
  domain?: string
  databaseName: string
  devDatabase: string
  devPort: number
  devStudioPort: number
}

export interface AppDependencies {
  vpc: any
  db: any
  env: Record<string, any>
  getRepoVersion: () => string
}

export interface AppResources {
  app: any
  migrator: any
  invocation: any
  devCommand: any
}

export interface CreateAppOptions {
  config: AppConfig
  dependencies: AppDependencies
  additionalLinks?: any[]
  transform?: {
    server?: (args: any) => void
  }
}

export function createApp(options: CreateAppOptions): AppResources {
  const { config, dependencies, additionalLinks = [], transform } = options
  const { vpc, db, env, getRepoVersion } = dependencies

  // Create the Next.js app
  const app = new sst.aws.Nextjs(config.name, {
    link: [db, ...additionalLinks],
    domain: config.domain
      ? {
          name: config.domain,
        }
      : undefined,
    vpc: vpc,
    path: config.path,
    environment: {
      ...env,
      NODE_ENV: $dev ? "development" : $app.stage,
    },
    transform: transform,
  })

  // Create the migrator function
  const migrator = new sst.aws.Function(`migrator-${config.name}`, {
    handler: `${config.path}/lib/db/index.migrator`,
    link: [db],
    vpc,
    timeout: "1 minute",
    environment: {
      ...env,
      NODE_ENV: $app.stage,
    },
    copyFiles: [
      {
        from: `${config.path}/lib/db/migrations`,
        to: `./migrations`,
      },
    ],
  })

  // Create the migrator invocation
  const invocation = new aws.lambda.Invocation(
    `migrator-${config.name}-invocation`,
    {
      input: JSON.stringify({
        version: getRepoVersion(),
      }),
      functionName: migrator.name,
    }
  )

  // Create the dev command
  const devCommand = new sst.x.DevCommand(`studio-${config.name}`, {
    link: [db],
    dev: {
      command: `bun drizzle-kit studio --port=${config.devStudioPort}`,
    },
    environment: {
      ...env,
      APP: config.name,
    },
  })

  return {
    app,
    migrator,
    invocation,
    devCommand,
  }
}
