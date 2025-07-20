import { cache } from "react"
import { verifyUserToken } from "@whop/api"
import { headers } from "next/headers"
import type { Sdk } from "@whop/api"
import type {
  UserData,
  UserAppStatus,
  WhopExperienceAccessLevel,
  PreUserAuthResult,
} from "./credentials"

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
