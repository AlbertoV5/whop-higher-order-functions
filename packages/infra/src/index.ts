// This library provides factory functions for creating SST apps with consistent patterns
declare const $dev: boolean
declare const $app: {
  stage: string
  name: string
}

export interface AppConfig {
  name: string
  path: string
  domain?: string
  /**
   * The port that the dev server will listen on.
   * The proxy will listen the upstream port on the next port.
   * The studio will listen on the next port.
   */
  devPort: number
}

export interface AppInfra<Sst extends CreateAppSstConstructors> {
  vpc: InstanceType<Sst["aws"]["Vpc"]>
  db: InstanceType<Sst["aws"]["Aurora"]>
}

export interface CreateAppSstConstructors {
  aws: {
    Nextjs: new (...args: any[]) => any
    Function: new (...args: any[]) => any
    Vpc: new (...args: any[]) => any
    Aurora: new (...args: any[]) => any
  }
  x: {
    DevCommand: new (...args: any[]) => any
  }
}

export interface CreateAppAwsConstructors {
  lambda: {
    Invocation: new (...args: any[]) => any
  }
}

export interface CreateAppOptions<
  Sst extends CreateAppSstConstructors,
  Aws extends CreateAppAwsConstructors
> {
  config: AppConfig
  infra: AppInfra<Sst>
  sst: Sst
  aws: Aws
  environment: Record<string, any>
  version: string
  additionalLinks?: any[]
  runMigrator?: boolean
  appFunctionTransform?: {
    server?: (args: { memory: string; timeout: string }) => any
  }
}

export function createApp<
  Sst extends CreateAppSstConstructors,
  Aws extends CreateAppAwsConstructors
>(
  options: CreateAppOptions<Sst, Aws>
): {
  app: InstanceType<Sst["aws"]["Nextjs"]>
  migrator: InstanceType<Sst["aws"]["Function"]>
  invocation?: InstanceType<Aws["lambda"]["Invocation"]>
  studioCommand: InstanceType<Sst["x"]["DevCommand"]>
} {
  const {
    sst,
    aws,
    config,
    infra,
    version,
    environment,
    additionalLinks = [],
    appFunctionTransform,
    runMigrator = true,
  } = options
  const { vpc, db } = infra
  // Create the Next.js app
  const proxyPort = config.devPort
  const upstreamPort = String(proxyPort + 1)
  const devStudioPort = String(proxyPort + 2)
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
      ...environment,
      NODE_ENV: $dev ? "development" : $app.stage,
    },
    dev: {
      command: `whop-proxy --command 'next dev --turbopack -p ${upstreamPort}' --upstreamPort=${upstreamPort} --proxyPort=${proxyPort}`,
      // url: `http://localhost:${proxyPort}`,
    },
    transform: appFunctionTransform,
  })
  // Create the migrator function
  const migrator = new sst.aws.Function(`migrator-${config.name}`, {
    handler: `${config.path}/lib/db/index.migrator`,
    link: [db],
    vpc,
    timeout: "1 minute",
    environment: {
      ...environment,
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
  let invocation: InstanceType<Aws["lambda"]["Invocation"]> | undefined
  if (runMigrator) {
    invocation = new aws.lambda.Invocation(
      `migrator-${config.name}-invocation`,
      {
        input: JSON.stringify({
          version: version,
        }),
        functionName: migrator.name,
      }
    )
  }
  // Create the dev command
  const studioCommand = new sst.x.DevCommand(`studio-${config.name}`, {
    link: [db],
    dev: {
      command: `bun drizzle-kit studio --port=${devStudioPort}`,
    },
    environment: {
      ...environment,
      APP: config.name,
    },
  })
  return {
    app,
    studioCommand,
    migrator,
    invocation,
  }
}
