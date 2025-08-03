import type { Sdk } from "@whop/api"

/** Developer are "super-admin" users */
export type UserAppStatus = "creator" | "user" | "developer"
export type WhopExperienceAccessLevel = "admin" | "customer" | "no_access"
export type UserData = {
  userId: string
  userStatus: UserAppStatus
  userAccessLevel: WhopExperienceAccessLevel
  userTier?: string
}
export type AuthenticatedUser<Status extends string, Tier extends string> = {
  userId: string
  userAccessLevel: WhopExperienceAccessLevel
  userStatus: Status
  userTier?: Tier
}

export type AuthenticatedProps<InputProps extends Record<string, any>> =
  InputProps & {
    userData: UserData
    experienceId: string
    cronSecret?: string
    skipUserFetching?: boolean
  }
export type CredentialsOptions = {
  requiredUserStatus?: UserAppStatus
  requiredAccessLevel?: WhopExperienceAccessLevel
}

// Configuration types for the factory
export type PreUserAuthResult = {
  userData: UserData
  cronSecret?: string
}

export type AuthenticationConfig = {
  sdk: Sdk
  preUserAuth?: (headersList: Headers) => Promise<PreUserAuthResult | null>
  getUserStatus: (params: {
    userId: string
    accessLevel: WhopExperienceAccessLevel
  }) => UserAppStatus | null
}
