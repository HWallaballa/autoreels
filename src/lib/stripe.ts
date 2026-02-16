import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER!,
    price: 29,
    videosPerMonth: 30,
    maxAccounts: 1,
    features: ["30 AI videos/month", "1 TikTok account", "Basic templates", "Direct posting"],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO!,
    price: 79,
    videosPerMonth: 100,
    maxAccounts: 5,
    features: ["100 AI videos/month", "5 TikTok accounts", "All templates", "Scheduling", "AI voiceover", "Priority support"],
  },
  agency: {
    name: "Agency",
    priceId: process.env.STRIPE_PRICE_AGENCY!,
    price: 199,
    videosPerMonth: 500,
    maxAccounts: 999,
    features: ["500 AI videos/month", "Unlimited accounts", "All templates", "Scheduling", "AI voiceover", "Priority generation", "API access"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
