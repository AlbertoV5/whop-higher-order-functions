# Whop Apps Framework - Auth

Authentication library for Whop applications providing user authentication, caching, and access control.

## Usage

### Basic Authentication

```ts
import { getAuthenticatedUser, Authenticated } from '@whoof/auth'

// Get authenticated user
const user = await getAuthenticatedUser(experienceId)

// Use higher-order function for protected routes
const protectedFunction = Authenticated(
  { 
    requiredAccessLevel: 'admin',
    requiredUserStatus: 'creator' 
  },
  async ({ userData, experienceId, ...props }) => {
    // Your protected logic here
    return { success: true, user: userData }
  }
)
```

## API Reference

### `getAuthenticatedUser(experienceId: string)`

Cache user authentication for the entire request.

**Parameters:**
- `experienceId`: The experience ID to authenticate against

**Returns:** User authentication data or null if not authenticated

### `Authenticated<Inputs, Output>(options, wrapped)`

Higher-order function that adds authentication to any function.

**Parameters:**
- `options`: Configuration object with `requiredAccessLevel` and `requiredUserStatus`
- `wrapped`: The function to wrap with authentication

**Returns:** Authenticated version of the wrapped function

## Development

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

To build:

```bash
bun run build
```

To check types:

```bash
bun run typecheck
```

## License

MIT

---

This project was created using `bun init` in bun v1.2.17. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


## Create Get Authenticated User function

```ts
// Cache user authentication for the entire request
export const getAuthenticatedUser = cache(async (experienceId: string) => {
  const developerUserIds = []
  return getCachedUserAuthentication(
    whopSdk,
    experienceId,
    ({ userId, accessLevel }: { userId: string; accessLevel: any }) => {
      if (!accessLevel || accessLevel === "no_access") return null
      if (developerUserIds.includes(userId)) {
        return "developer"
      }
      if (accessLevel === "admin") {
        return "creator"
      }
      if (accessLevel === "customer") {
        return "user"
      }
      return null
    },
    async (headersList: Headers) => {
      const cronSecret = headersList.get("Authorization")?.split(" ")[1]
      if (cronSecret) {
        if (cronSecret !== env.CRON_SECRET) {
          throw new Error("Unauthorized")
        }
        return {
          userData: {
            userId: "system",
            userStatus: "developer",
            userAccessLevel: "admin",
          },
          cronSecret,
        }
      }
      return null
    }
  )
})
```

## Create Higher Order Function

```ts
export function Authenticated<Inputs extends Record<string, any>, Output>(
  options: CredentialsOptions,
  wrapped: (inputProps: AuthenticatedProps<Inputs>) => Promise<Output>
) {
  return async (rawProps?: Inputs & { experienceId?: string }) => {
    const props = rawProps || ({} as Inputs)
    const experienceId = rawProps?.experienceId || getExperienceId()
    const user = await getAuthenticatedUser(experienceId)
    if (!user) {
      throw new Error("Unauthorized")
    }
    const { requiredAccessLevel, requiredUserStatus } = options
    if (requiredAccessLevel && user.userAccessLevel !== requiredAccessLevel) {
      throw new Error("Unauthorized, access level mismatch")
    }
    if (requiredUserStatus && user.userStatus !== requiredUserStatus) {
      throw new Error("Unauthorized, user status mismatch")
    }
    return wrapped({ ...props, userData: user, experienceId })
  }
}

```