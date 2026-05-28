// Tessera Lumen subscription plan definitions
// Single source of truth for plan limits, pricing, and quota logic
// Plan 7 (Unlimited) REMOVED
//
// Subscription card logic:
//   cards = number of cards drawn per single reading (all subs = 1)
//   readsPerDay = how many readings allowed per day
//   readsLimit  = total readings allowed per month

export const PLANS = {
  // One-time readings  no quota tracking needed
  1: { id: 1, type: "one-time", name: "Quick Insight",         priceZAR: "3.99",  cards: 1, readsLimit: null },
  2: { id: 2, type: "one-time", name: "Past, Present, Future", priceZAR: "9.99",  cards: 3, readsLimit: null },
  3: { id: 3, type: "one-time", name: "Deep Dive",             priceZAR: "19.99", cards: 5, readsLimit: null },
  // Subscriptions  1 card per reading, daily read limit enforced
  4: { id: 4, type: "sub", name: "10 Readings / Month",  priceZAR: "9.99",  cards: 1, readsLimit: 10, readsPerDay: 1 },
  5: { id: 5, type: "sub", name: "20 Readings / Month",  priceZAR: "17.99", cards: 1, readsLimit: 20, readsPerDay: 2 },
  6: { id: 6, type: "sub", name: "30 Readings / Month",  priceZAR: "24.99", cards: 1, readsLimit: 30, readsPerDay: 3 },
};

export function getPlan(id) {
  return PLANS[id] || null;
}

export function isSubscription(planId) {
  return PLANS[planId]?.type === "sub";
}

export function getReadsLimit(planId) {
  return PLANS[planId]?.readsLimit ?? null;
}

export function getReadsPerDay(planId) {
  return PLANS[planId]?.readsPerDay ?? null;
}
