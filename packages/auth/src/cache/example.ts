import { createSubscriptionAccessModel } from "@whoof/config"
import { createUserAuthentication } from "./auth-cache"
import { cache } from "react"

import { WhopServerSdk } from "@whop/api"

const whopSdk = WhopServerSdk({
  appId: "123",
  appApiKey: "test",
})

export const accessModel = createSubscriptionAccessModel({
  tierOrder: ["free", "basic", "pro", "elite"],
  tiers: {
    free: {
      name: "Free",
      isFree: true,
      isAvailable: true,
      checkout: null,
      properties: {
        quota: {
          dailyLimit: 50,
          weeklyLimit: 100,
          monthlyLimit: 250,
          assistantMonthlyLimit: 5,
        },
      },
    },
    basic: {
      name: "Basic",
      isFree: false,
      isAvailable: true,
      checkout: {
        price: 20,
        currency: "USD",
        accessPassId: "123",
        planId: "123",
      },
      properties: {
        quota: {
          dailyLimit: 10000,
          weeklyLimit: 20000,
          monthlyLimit: 50000,
          assistantMonthlyLimit: 25,
        },
      },
    },
    pro: {
      name: "Pro",
      isFree: false,
      isAvailable: true,
      checkout: {
        price: 50,
        currency: "USD",
        accessPassId: "abc",
        planId: "123",
      },
      properties: {
        quota: {
          dailyLimit: 30000,
          weeklyLimit: 60000,
          monthlyLimit: 150000,
          assistantMonthlyLimit: 75,
        },
      },
    },
    elite: {
      name: "Elite",
      isFree: false,
      isAvailable: false,
      checkout: null,
      properties: {
        quota: {
          dailyLimit: 60000,
          weeklyLimit: 120000,
          monthlyLimit: 300000,
          assistantMonthlyLimit: 150,
        },
      },
    },
  },
})
// Cache user authentication for the entire request
export const getAuthenticatedUser = cache(async (experienceId: string) => {
  return createUserAuthentication(
    whopSdk,
    experienceId,
    ({ userId, accessLevel }) => {
      if (!accessLevel || accessLevel === "no_access") return null
      if (["123", "abc"].includes(userId)) {
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
    {
      accessModel,
      defaultTier: "free",
      validators: {
        elite: async ({ userStatus }) => userStatus === "developer",
      },
    },
    async (headersList: any) => {
      const apiSecret = headersList.get("Authorization")?.split(" ")[1]
      if (apiSecret) {
        if (apiSecret !== "123456") {
          throw new Error("Unauthorized")
        }
        return {
          userData: {
            userId: "system",
            userStatus: "developer",
            userAccessLevel: "admin",
            userTier: "elite",
          },
          apiSecret,
        }
      }
      return null
    }
  )
})
