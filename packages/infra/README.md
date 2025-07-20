# @whoof/infra

A library for creating SST (Serverless Stack) applications with consistent patterns and reusable components.

## Overview

This library provides factory functions for creating SST apps with consistent patterns, reducing boilerplate code and ensuring standardized configurations across different applications.

## Installation

Install directly from GitHub:

```bash
bun add git+git@github.com:AlbertoV5/whoof-infra.git
```

Or with npm:

```bash
npm install git+git@github.com:AlbertoV5/whoof-infra.git
```

In a workspace, it's automatically available as `@whoof/infra`.

## Features

- **Factory Functions**: Create SST apps, migrators, and dev commands with consistent patterns
- **Environment Mapping**: Easy configuration of environment variables
- **Type Safety**: Full TypeScript support with proper type definitions
- **Simplified API**: No need to pass SST constructors - they're available globally
- **Flexible**: Supports additional links, custom transforms, and environment mappings

## Usage

### Basic App Creation

```typescript
import { createApp } from "@whoof/infra"

const appResources = createApp({
  config: {
    name: "my-app",
    path: "./packages/my-app",
    domain: "my-app.example.com",
    databaseName: "my-app",
    devDatabase: "dev-my-app",
    devPort: 3000,
    devStudioPort: 3010,
  },
  dependencies: {
    vpc,
    db,
    env,
    getRepoVersion,
  },
})

// Access individual resources
export const app = appResources.app
export const migrator = appResources.migrator
```

### App with Additional Links

```typescript
import { campaignsStateMachine } from "../stateMachines/campaigns"

const appResources = createApp({
  config: rs.campaigns,
  dependencies: { vpc, db, env, getRepoVersion },
  additionalLinks: [campaignsStateMachine],
  transform: {
    server: (args) => {
      args.memory = "1536 MB"
      args.timeout = "5 minutes"
    },
  },
})
```

### App with Environment Mapping

```typescript
import { createApp, createEnvMapping } from "@whoof/infra"

const envMapping = {
  NEXT_PUBLIC_GTS_WHOP_AGENT_USER_ID: "NEXT_PUBLIC_WHOP_AGENT_USER_ID",
  NEXT_PUBLIC_GTS_WHOP_COMPANY_ID: "NEXT_PUBLIC_WHOP_COMPANY_ID",
  GTS_WHOP_API_KEY: "WHOP_API_KEY",
}

const appResources = createApp({
  config: rs.gts,
  dependencies: { 
    vpc, 
    db, 
    env: {
      ...env,
      ...createEnvMapping(envMapping, getWhopEnv),
    },
    getRepoVersion 
  },
  additionalLinks: [systemStateMachine, payUser],
})
```

## API Reference

### `createApp(options: CreateAppOptions): AppResources`

Creates a complete SST app with associated resources.

#### Parameters

- `config: AppConfig` - App configuration
- `dependencies: AppDependencies` - Required dependencies (VPC, DB, etc.)
- `additionalLinks?: any[]` - Additional resources to link to the app
- `transform?: { server?: (args: any) => void }` - Custom transform functions

#### Returns

Returns an object with:
- `app` - The Next.js application
- `migrator` - The database migrator function
- `invocation` - The migrator invocation
- `devCommand` - The development studio command

### `createEnvMapping(mapping: Record<string, string>, getWhopEnv: Function): Record<string, any>`

Helper function to create environment variable mappings.

## Types

### `AppConfig`

```typescript
interface AppConfig {
  name: string
  path: string
  domain: string
  databaseName: string
  devDatabase: string
  devPort: number
  devStudioPort: number
}
```

### `AppDependencies`

```typescript
interface AppDependencies {
  vpc: any
  db: any
  env: Record<string, any>
  getRepoVersion: () => string
}
```

## Benefits

1. **Consistency**: All apps follow the same patterns and configurations
2. **Reduced Boilerplate**: Factory functions eliminate repetitive code
3. **Type Safety**: Full TypeScript support with proper type definitions
4. **Maintainability**: Centralized configuration logic
5. **Flexibility**: Supports customization while maintaining consistency
6. **Simplified API**: No need to pass SST constructors - they're available globally

## Example: Complete App Setup

```typescript
// infra/apps/my-app.ts
import { vpc } from "../network/vpc"
import { db } from "../storage/db"
import { env } from "../env"
import { getRepoVersion, rs } from "../resources"
import { myStateMachine } from "../stateMachines/my-state-machine"
import { createApp } from "@whoof/infra"

const myAppResources = createApp({
  config: rs.myApp,
  dependencies: {
    vpc,
    db,
    env,
    getRepoVersion,
  },
  additionalLinks: [myStateMachine],
})

export const appMyApp = myAppResources.app
export const migratorMyApp = myAppResources.migrator
```

This creates a complete app with:
- Next.js application with proper domain configuration
- Database migrator function with automatic migrations
- Development studio command for database management
- Proper environment variable configuration
- VPC and security configuration

## Migration from Previous Version

If you're upgrading from a previous version that required SST constructors:

**Before:**
```typescript
const appResources = createApp({
  config: rs.campaigns,
  dependencies: { vpc, db, env, getRepoVersion },
  sst: {
    Nextjs: sst.aws.Nextjs,
    Function: sst.aws.Function,
    DevCommand: sst.x.DevCommand,
    Invocation: aws.lambda.Invocation,
    globals: { $dev, $app },
  },
  envMapping: createEnvMapping(envMapping, getWhopEnv),
})
```

**After:**
```typescript
const appResources = createApp({
  config: rs.campaigns,
  dependencies: { 
    vpc, 
    db, 
    env: {
      ...env,
      ...createEnvMapping(envMapping, getWhopEnv),
    },
    getRepoVersion 
  },
})
```
