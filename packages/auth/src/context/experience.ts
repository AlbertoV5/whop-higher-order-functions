import { AsyncLocalStorage } from "async_hooks"
import type { Sdk } from "@whop/api"

// Define the experience type based on whopSdk.experiences.getExperience response
export type WhopExperience = Awaited<
  ReturnType<Sdk["experiences"]["getExperience"]>
>

// Define the context type
export interface ServerContext {
  experienceId: string
  userId?: string
  experience?: WhopExperience
}

// Create the async local storage instance
const asyncLocalStorage = new AsyncLocalStorage<ServerContext>()

/**
 * Runs a function with the experienceId in async context
 * This should be called at the top level of your request handling
 * If experienceFetcher is provided, it will fetch the experience if not already cached
 * The view function receives the experience object directly
 */
export async function withExperience<T>(options: {
  sdk: Sdk
  experienceId: string
  view: (experience: WhopExperience) => T | Promise<T>
  userId?: string
  experience?: WhopExperience
}): Promise<T> {
  const { sdk, experienceId, view, userId, experience } = options
  let finalExperience = experience

  // If no experience provided but fetcher is available, fetch it
  if (!finalExperience) {
    const fetchedExperience = await sdk.experiences.getExperience({
      experienceId,
    })
    if (!fetchedExperience) {
      throw new Error(`Experience with ID ${experienceId} not found`)
    }
    finalExperience = fetchedExperience
  }

  // Experience is required at this point
  if (!finalExperience) {
    throw new Error(
      `Experience is required but not provided for experienceId: ${experienceId}`
    )
  }

  const context: ServerContext = {
    experienceId,
    userId,
    experience: finalExperience,
  }
  return asyncLocalStorage.run(context, () => view(finalExperience))
}

/**
 * Gets the current experienceId from async context
 * Similar to how await headers() works
 */
export function getExperienceId(): string {
  const context = asyncLocalStorage.getStore()
  if (!context?.experienceId) {
    throw new Error(
      "experienceId not found in context. Make sure you are calling this within withExperienceContext."
    )
  }
  return context.experienceId
}

/**
 * Gets the current userId from async context (if available)
 */
export function getUserId(): string | undefined {
  const context = asyncLocalStorage.getStore()
  return context?.userId
}

/**
 * Gets the cached experience from async context
 * Returns undefined if no experience is cached
 */
export function getCachedExperience(): WhopExperience | undefined {
  const context = asyncLocalStorage.getStore()
  return context?.experience
}

/**
 * Sets the experience in the current context
 * This is useful for caching the experience after fetching it
 */
export function setCachedExperience(experience: WhopExperience): void {
  const context = asyncLocalStorage.getStore()
  if (!context) {
    throw new Error(
      "No context found. Make sure you are calling this within withExperienceContext."
    )
  }
  context.experience = experience
}

/**
 * Gets the cached experience or fetches it using the provided fetcher function
 * The fetcher function receives the experienceId and should return the experience
 * If there's an error fetching, it will be thrown
 */
export async function getOrFetchExperience<T extends WhopExperience>(
  fetcher: (experienceId: string) => Promise<T | null>
): Promise<T> {
  const cached = getCachedExperience() as T | undefined
  if (cached) {
    return cached
  }

  const experienceId = getExperienceId()
  const experience = await fetcher(experienceId)

  if (!experience) {
    throw new Error(`Experience with ID ${experienceId} not found`)
  }

  setCachedExperience(experience)
  return experience
}

/**
 * Gets the full context (useful for optional access)
 */
export function getContext(): ServerContext | undefined {
  return asyncLocalStorage.getStore()
}

/**
 * Checks if we're currently in an experience context
 */
export function hasExperienceContext(): boolean {
  const context = asyncLocalStorage.getStore()
  return !!context?.experienceId
}

/**
 * Gets the cached experience or throws an error if not available
 * This is useful when you know the experience should be cached (e.g., after layout has run)
 */
export function getExperience(): WhopExperience {
  const experience = getCachedExperience()
  if (!experience) {
    throw new Error(
      "Experience not found in context. Make sure the experience has been fetched and cached in the layout."
    )
  }
  return experience
}
