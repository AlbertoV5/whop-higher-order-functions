/**
 * @description Subscription access model
 * @template Properties - The properties of the subscription access model
 * @example
 */
export type SubscriptionAccessModel<
  Properties extends Record<string, any>,
  TierKey extends string = string
> = {
  tierOrder: TierKey[]
  tiers: Record<TierKey, TierData<Properties>>
}
export type TierData<Properties extends Record<string, any>> = {
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

// Helper type to infer properties type from tier data
type InferPropertiesType<T> = T extends Record<string, TierData<infer P>>
  ? P
  : never

/**
 * Helper function to create a SubscriptionAccessModel with type-safe tierOrder
 * Automatically infers the Properties type from the tier data
 */
export function createSubscriptionAccessModel<
  const T extends Record<string, TierData<any>>
>(config: {
  tiers: T
  tierOrder: (keyof T)[]
}): SubscriptionAccessModel<InferPropertiesType<T>, keyof T & string> {
  return config as SubscriptionAccessModel<
    InferPropertiesType<T>,
    keyof T & string
  >
}

/**
 * Get the checkout options for a tier
 * List all tiers that are not free and are available that are after the tier in the order
 * @param accessModel - The access model
 * @param tier - The tier to get the checkout options for
 * @returns The checkout options for the tier
 */
export function getTiersOptionsForUserTier<
  Properties extends Record<string, any>,
  TierKey extends string = string
>(accessModel: SubscriptionAccessModel<Properties, TierKey>, tier: TierKey) {
  const tiers = accessModel.tierOrder.filter(
    (t) =>
      !accessModel.tiers[t].isFree &&
      accessModel.tiers[t].isAvailable &&
      t > tier
  )
  return tiers.map((t) => accessModel.tiers[t])
}
