// Retry configuration for Aurora resuming
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 2000, // 2 seconds
  maxDelay: 10000, // 10 seconds
}

// Helper function to check if error is Aurora resuming
const isAuroraResumingError = (error: any): boolean => {
  return (
    error?.message?.includes("resuming after being auto-paused") ||
    error?.name === "DatabaseResumingException" ||
    error?.code === "DatabaseResumingException"
  )
}

// Exponential backoff delay
const calculateDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1)
  return Math.min(delay, RETRY_CONFIG.maxDelay)
}

// Sleep utility
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Retry wrapper for database operations
export const withAuroraRetry = async <T>(
  operation: () => Promise<T>,
  context: string = "database operation"
): Promise<T> => {
  let lastError: any

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (isAuroraResumingError(error) && attempt < RETRY_CONFIG.maxAttempts) {
        const delay = calculateDelay(attempt)
        console.warn(
          `Aurora DB resuming (attempt ${attempt}/${RETRY_CONFIG.maxAttempts}), retrying ${context} in ${delay}ms...`
        )
        await sleep(delay)
        continue
      }
      throw error
    }
  }

  throw lastError
}

// Helper function to execute queries with retry logic
export const executeWithRetry = async <T>(
  queryOperation: () => Promise<T>,
  operationName?: string
): Promise<T> => {
  return withAuroraRetry(queryOperation, operationName || "query")
}
