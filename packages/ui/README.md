# @whoof/ui

UI components and higher-order functions for Whop apps. This package provides reusable components and layout patterns for building consistent Whop applications with authentication, error handling, and role-based rendering.

## Features

- 🎨 **Ready-to-use components** for common UI states (Unauthorized, OutOfBounds, NoExperience)
- 🔧 **Higher-order functions** for layout management with authentication
- 🎭 **Role-based rendering** (Developer, Admin, User)
- 🛡️ **Built-in error handling** and fallback components
- 📦 **TypeScript** support with full type safety
- 🎯 **Frosted UI** integration with theme support

### Dependencies

You'll need to install the peer dependencies:

```bash
bun add react @whop/react frosted-ui
```

## Usage

### Basic Components

```tsx
import { OutOfBounds, Unauthorized, NoExperience } from '@whoof/ui'

// OutOfBounds - when experience ID is missing
<OutOfBounds 
  themeConfig={themeConfig}
  appId="your-app-id"
  fonts="font-class"
  message="Custom message"
  installUrl="https://custom-install-url.com"
/>

// Unauthorized - when user lacks access
<Unauthorized 
  themeConfig={themeConfig}
  appId="your-app-id"
  fonts="font-class"
  message="Custom unauthorized message"
  showPurchaseLink={true}
  purchaseUrl="https://purchase-url.com"
/>

// NoExperience - when experience doesn't exist
<NoExperience 
  themeConfig={themeConfig}
  appId="your-app-id"
  fonts="font-class"
  message="Custom no experience message"
/>
```

### Higher-Order Layout Functions

#### `withExperienceLayout` (Recommended)

This HOF mirrors the exact pattern from your existing layout and is perfect for most use cases:

```tsx
import { withExperienceLayout } from '@whoof/ui'
import { AdminContent, UserContent, DeveloperContent } from './components'
import { getAuthenticatedUser } from './auth'
import { whopSdk } from './whop'

const Layout = withExperienceLayout(
  {
    themeConfig,
    appId: 'your-app-id',
    fonts: 'font-class'
  },
  {
    components: {
      DeveloperContent,
      AdminContent, 
      UserContent
    },
    getAuthenticatedUser,
    getExperience: async (experienceId) => {
      return await whopSdk.experiences.getExperience({ experienceId })
    },
    fetchAdditionalData: async (userData, experienceId) => {
      // Fetch any additional data needed by your components
      const [userPlan, competitions] = await Promise.all([
        getUserPlan(userData.userId, experienceId),
        getCompetitions()
      ])
      return { userPlan, competitions }
    },
    withExperienceContext: (experienceId, fn) => {
      // Optional: wrap with experience context
      return withExperienceContext(experienceId, fn)
    }
  }
)

export default Layout
```

#### `withLayout` (Alternative)

A more flexible HOF that provides full layout props to your components:

```tsx
import { withLayout } from '@whoof/ui'

const Layout = withLayout(
  {
    themeConfig,
    appId: 'your-app-id',
    fonts: 'font-class'
  },
  {
    components: {
      DeveloperContent: ({ userData, owner, experienceId, additionalData }) => (
        <div>Developer view for {userData.userId}</div>
      ),
      AdminContent: ({ userData, experienceId, additionalData }) => (
        <div>Admin view</div>
      ),
      UserContent: ({ userData, owner, experienceId, additionalData }) => (
        <div>User view</div>
      )
    },
    getAuthenticatedUser,
    getExperience,
    fetchAdditionalData
  }
)
```

### Component Interfaces

Your content components should implement these interfaces:

```tsx
// For withExperienceLayout
interface DeveloperContentProps {
  userId: string
  experienceId: string
  owner: Owner
  additionalData?: any
}

interface AdminContentProps {
  userId: string
  experienceId: string
  additionalData?: any
}

interface UserContentProps {
  userId: string
  experienceId: string
  owner: Owner
  additionalData?: any
}

// For withLayout
interface LayoutProps<T = any> {
  themeConfig: ThemeProps
  appId: string
  fonts: string
  experienceId: string
  userData: UserData
  owner: Owner
  additionalData?: T
}
```

### Migration from Existing Layout

If you have an existing layout like the one in your codebase, here's how to migrate:

**Before:**
```tsx
export default async function Layout({ children, params }) {
  const { experienceId } = await params
  // ... authentication logic
  // ... data fetching
  // ... component rendering
}
```

**After:**
```tsx
import { withExperienceLayout } from '@whoof/ui'

export default withExperienceLayout(themeConfig, {
  components: { DeveloperContent, AdminContent, UserContent },
  getAuthenticatedUser,
  getExperience: async (experienceId) => {
    return await whopSdk.experiences.getExperience({ experienceId })
  },
  fetchAdditionalData: async (userData, experienceId) => {
    const [userPlan, currentCompetitions, completedCompetitions] = await Promise.all([
      getUserPlan(userData.userId, experienceId),
      CompetitionsAPI.list({ completed: false }),
      CompetitionsAPI.list({ completed: true }),
    ])
    return { userPlan, currentCompetitions, completedCompetitions }
  },
  withExperienceContext
})
```

## API Reference

### Components

#### `OutOfBounds`
- `themeConfig`: Frosted UI theme configuration
- `appId`: Your Whop app ID
- `fonts`: Font class names
- `message?`: Custom message (default: "Please install this app via Whop.")
- `installUrl?`: Custom install URL

#### `Unauthorized`
- `themeConfig`: Frosted UI theme configuration
- `appId`: Your Whop app ID
- `fonts`: Font class names
- `message?`: Custom message
- `showPurchaseLink?`: Show purchase link
- `purchaseUrl?`: Custom purchase URL

#### `NoExperience`
- `themeConfig`: Frosted UI theme configuration
- `appId`: Your Whop app ID
- `fonts`: Font class names
- `message?`: Custom message

### Types

```tsx
interface UserData {
  userId: string
  userStatus: 'developer' | 'creator' | 'user'
  userAccessLevel: 'admin' | 'customer' | 'no_access'
}

interface Owner {
  id: string
  username: string
  name: string
}

interface Experience {
  id: string
  company: {
    id: string
    title: string
  }
}
```

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
