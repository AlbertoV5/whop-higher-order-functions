import { createSubscriptionAccessModel } from "./subscription"

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
