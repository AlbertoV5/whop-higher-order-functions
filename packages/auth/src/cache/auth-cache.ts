import { cache } from "react"
import { verifyUserToken } from "@whop/api"
import { headers } from "next/headers"
import type { Sdk } from "@whop/api"
import type {
  UserData,
  UserAppStatus,
  WhopExperienceAccessLevel,
  PreUserAuthResult,
  AuthenticatedUser,
} from "./types"
import type { SubscriptionAccessModel } from "@whoof/config"

// Cache the token verification to avoid multiple calls per request
export const getCachedUserToken = cache(async () => {
  const headersList = await headers()
  return verifyUserToken(headersList)
})

// Cache the user access check to avoid multiple API calls
export const getCachedUserAccess = cache(
  async (sdk: Sdk, userId: string, experienceId: string) => {
    return sdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId,
    })
  }
)

// Cache the complete user authentication data
/**
 * @deprecated Use createUserAuthentication instead
 */
export const getCachedUserAuthentication = cache(
  async (
    sdk: Sdk,
    experienceId: string,
    getUserStatus: (params: {
      userId: string
      accessLevel: WhopExperienceAccessLevel
    }) => UserAppStatus | null,
    preUserAuth?: (headersList: Headers) => Promise<PreUserAuthResult | null>
  ): Promise<UserData | null> => {
    const headersList = await headers()
    // Check pre-user authentication if configured
    if (preUserAuth) {
      const preAuthResult = await preUserAuth(headersList)
      if (preAuthResult) {
        return preAuthResult.userData
      }
    }
    // Get cached user token
    const user = await getCachedUserToken()
    if (!user) {
      return null
    }
    // Get cached user access
    const hasAccess = await getCachedUserAccess(sdk, user.userId, experienceId)

    const userStatus = getUserStatus({
      userId: user.userId,
      accessLevel: hasAccess.accessLevel,
    })

    if (!userStatus) {
      return null
    }

    return {
      userId: user.userId,
      userStatus,
      userAccessLevel: hasAccess.accessLevel,
    }
  }
)

// Cache the complete user authentication data
export const createUserAuthentication = cache(
  async <
    UserStatus extends string,
    SubscriptionProperties extends Record<string, any>,
    SubscriptionTierKey extends string = string
  >(
    sdk: Sdk,
    experienceId: string,
    getUserStatus: (params: {
      userId: string
      accessLevel: WhopExperienceAccessLevel
    }) => UserStatus | null,
    accessConfig?: {
      accessModel: SubscriptionAccessModel<
        SubscriptionProperties,
        SubscriptionTierKey
      >
      defaultTier: SubscriptionTierKey
      validators?: Partial<
        Record<
          SubscriptionTierKey,
          (
            user: Omit<
              AuthenticatedUser<UserStatus, SubscriptionTierKey>,
              "userTier"
            >
          ) => Promise<boolean>
        >
      >
    },
    preUserAuth?: (headersList: Headers) => Promise<{
      userData: AuthenticatedUser<UserStatus, SubscriptionTierKey>
      apiSecret?: string
    } | null>
  ): Promise<AuthenticatedUser<UserStatus, SubscriptionTierKey> | null> => {
    const headersList = await headers()
    // Check pre-user authentication if configured
    if (preUserAuth) {
      const preAuthResult = await preUserAuth(headersList)
      if (preAuthResult) {
        return preAuthResult.userData
      }
    }
    // Get cached user token
    const user = await getCachedUserToken()
    if (!user) {
      return null
    }
    // Get cached user access
    const hasAccess = await getCachedUserAccess(sdk, user.userId, experienceId)

    const userStatus = getUserStatus({
      userId: user.userId,
      accessLevel: hasAccess.accessLevel,
    })

    if (!userStatus) {
      return null
    }
    let userTier = accessConfig?.defaultTier
    if (accessConfig) {
      const getUserTier = async () => {
        const model = accessConfig.accessModel
        for (const key of model.tierOrder.reverse()) {
          const defaultValidator = async () => {
            const tierCheckout = model.tiers[key].checkout
            if (!tierCheckout) return false
            const result = await sdk.access.checkIfUserHasAccessToAccessPass({
              accessPassId: tierCheckout.accessPassId,
              userId: user.userId,
            })
            return result.hasAccess
          }
          const method = accessConfig.validators?.[key] ?? defaultValidator
          const isValid = await method({
            userId: user.userId,
            userStatus,
            userAccessLevel: hasAccess.accessLevel,
          })
          if (isValid) return key
        }
        return accessConfig.defaultTier
      }
      userTier = await getUserTier()
    }

    return {
      userId: user.userId,
      userStatus,
      userAccessLevel: hasAccess.accessLevel,
      userTier,
    }
  }
)
