import { verifyUserToken } from "@whop/api"
import { getExperienceId } from "../context/experience"
import { headers } from "next/headers"
import type {
  AuthenticationConfig,
  CredentialsOptions,
  AuthenticatedProps,
} from "../cache/types"

// Factory function to create Authenticated function with custom configuration
export function createAuthenticationFunction(config: AuthenticationConfig) {
  return function <Inputs extends Record<string, any>, Output>(
    options: CredentialsOptions,
    wrapped: (inputProps: AuthenticatedProps<Inputs>) => Promise<Output>
  ): (props?: Inputs & { experienceId?: string }) => Promise<Output> {
    return async (rawProps?: Inputs) => {
      const props = rawProps || ({} as Inputs)
      // Attempt to get experienceId from props, otherwise get it from the context
      let experienceId = props.experienceId
      if (!experienceId) {
        experienceId = getExperienceId()
      }
      const headersList = await headers()
      // Check pre-user authentication if configured
      if (config.preUserAuth) {
        const preAuthResult = await config.preUserAuth(headersList)
        if (preAuthResult) {
          return wrapped({
            ...props,
            ...preAuthResult,
            experienceId,
          })
        }
      }
      // Handle user authentication
      const user = await verifyUserToken(headersList)
      if (!user) {
        throw new Error("Unauthorized")
      }
      // Get user access to the experience
      const hasAccess =
        await config.sdk.access.checkIfUserHasAccessToExperience({
          userId: user.userId,
          experienceId,
        })

      const userStatus = config.getUserStatus({
        userId: user.userId,
        accessLevel: hasAccess.accessLevel,
      })

      if (!userStatus) {
        throw new Error("Unauthorized")
      }

      if (
        options?.requiredUserStatus &&
        userStatus !== options.requiredUserStatus
      ) {
        throw new Error("Unauthorized")
      }

      return wrapped({
        ...props,
        userData: {
          userId: user.userId,
          userStatus,
          userAccessLevel: hasAccess.accessLevel,
        },
        experienceId,
      })
    }
  }
}
