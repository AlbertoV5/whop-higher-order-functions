import type { ReactNode } from "react"
import type { ThemeProps } from "frosted-ui/theme"

export interface UserData {
  userId: string
  userStatus: "developer" | "creator" | "user"
  userAccessLevel: "admin" | "customer" | "no_access"
}

export interface Owner {
  id: string
  username: string
  name: string
}

export interface Experience {
  id: string
  company: {
    id: string
    title: string
  }
}

export interface ThemeConfig {
  themeConfig: ThemeProps
  appId: string
  fonts: string
}

export interface LayoutConfig extends ThemeConfig {
  experienceId: string
}

export interface LayoutProps<T = any> extends LayoutConfig {
  userData: UserData
  owner: Owner
  additionalData?: T
}

export interface LayoutComponents<T = any> {
  DeveloperContent: (props: LayoutProps<T>) => ReactNode
  AdminContent: (props: LayoutProps<T>) => ReactNode
  UserContent: (props: LayoutProps<T>) => ReactNode
}

export interface LayoutOptions<T = any> {
  components: LayoutComponents<T>
  getAuthenticatedUser: (experienceId: string) => Promise<UserData | null>
  getExperience: (experienceId: string) => Promise<Experience | null>
  fetchAdditionalData?: (userData: UserData, experienceId: string) => Promise<T>
}

export interface WithLayoutResult {
  children: ReactNode
  params: Promise<{ experienceId: string }>
}

export type LayoutFunction<T = any> = (
  props: WithLayoutResult
) => Promise<ReactNode>
