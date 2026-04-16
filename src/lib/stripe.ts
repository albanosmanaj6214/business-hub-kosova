import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 3900,
    currency: 'eur',
    interval: 'month' as const,
    features: ['Databaza e granteve', 'Kalendari i panaireve', '5 udhezues/muaj', 'Email njoftime'],
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 9900,
    currency: 'eur',
    interval: 'month' as const,
    features: ['Gjithcka ne Starter', 'Udhezues pa limit', 'AI njoftime', '2 konsultime/muaj'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 24900,
    currency: 'eur',
    interval: 'month' as const,
    features: ['Gjithcka ne Professional', 'Konsultime pa limit', 'API akses', 'Suport prioritar'],
  },
}
