# @whoof/config

Shared models and types for Whop applications with server and client side compatibility.

## Features

- 🔧 **Universal**: Works on both server-side and client-side
- 🛡️ **Type-safe**: Full TypeScript support with strict typing
- 📦 **Subscription Models**: Type-safe subscription and tier management
- 🎯 **Tier Management**: Helper functions for subscription tier logic
- ⚡ **Lightweight**: Minimal dependencies and optimized for performance

## Installation

```bash
bun add @whoof/config
```

## Usage

### Subscription Access Model

```typescript
import { createSubscriptionAccessModel, SubscriptionAccessModel } from '@whoof/config';

// Create a subscription access model with type-safe tier configuration
const accessModel = createSubscriptionAccessModel({
  tierOrder: ["free", "basic", "pro", "elite"],
  tiers: {
    free: {
      name: "Free",
      isFree: true,
      isAvailable: true,
      checkout: null,
      properties: {
        quota: {
          dailyLimit: 50,
          weeklyLimit: 100,
          monthlyLimit: 250,
          assistantMonthlyLimit: 5,
        },
      },
    },
    basic: {
      name: "Basic",
      isFree: false,
      isAvailable: true,
      checkout: {
        price: 20,
        currency: "USD",
        accessPassId: "123",
        planId: "plan_fLOXNdrfeVhHz",
      },
      properties: {
        quota: {
          dailyLimit: 10000,
          weeklyLimit: 20000,
          monthlyLimit: 50000,
          assistantMonthlyLimit: 25,
        },
      },
    },
    // ... more tiers
  },
});
```

### Tier Management

```typescript
import { getTiersOptionsForUserTier } from '@whoof/config';

// Get available upgrade options for a user's current tier
const upgradeOptions = getTiersOptionsForUserTier(accessModel, 'free');

// This returns all non-free, available tiers that come after 'free' in the tier order
console.log(upgradeOptions); // Returns basic, pro, elite tier data
```

### Type-safe Properties

```typescript
// The accessModel automatically infers the properties type from your tier data
type QuotaProperties = {
  quota: {
    dailyLimit: number;
    weeklyLimit: number;
    monthlyLimit: number;
    assistantMonthlyLimit: number;
  };
};

// Access tier properties with full type safety
const freeQuota = accessModel.tiers.free.properties.quota;
// freeQuota is fully typed with intellisense support
```

## API Reference

### Types

#### `SubscriptionAccessModel<Properties, TierKey>`

The main subscription access model type.

```typescript
type SubscriptionAccessModel<
  Properties extends Record<string, any>,
  TierKey extends string = string
> = {
  tierOrder: TierKey[]
  tiers: Record<TierKey, TierData<Properties>>
}
```

#### `TierData<Properties>`

Individual tier configuration.

```typescript
type TierData<Properties extends Record<string, any>> = {
  name: string
  description?: string
  isFree: boolean
  isAvailable: boolean
  checkout: {
    price: number
    currency: string
    accessPassId: string
    planId: string
  } | null
  properties: Properties
}
```

### Functions

#### `createSubscriptionAccessModel(config)`

Helper function to create a type-safe subscription access model.

- **Parameters**: `{ tiers: T, tierOrder: (keyof T)[] }`
- **Returns**: `SubscriptionAccessModel<InferredProperties, TierKey>`

#### `getTiersOptionsForUserTier(accessModel, tier)`

Get available upgrade options for a specific tier.

- **Parameters**: 
  - `accessModel`: The subscription access model
  - `tier`: The current tier key
- **Returns**: Array of `TierData` for available upgrades

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build package
bun run build

# Type check
bun run typecheck
```

## License

MIT
