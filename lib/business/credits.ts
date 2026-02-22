export function computeFutureAds(totalSuccessfulDeals: number, now = new Date()) {
  const credits = totalSuccessfulDeals * 5;
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 30);
  return { credits, validUntil: validUntil.toISOString() };
}

export function computeHotDealCredits(totalListings: number) {
  const credits = Math.floor(totalListings / 10);
  return {
    credits,
    boostHours: 48,
  };
}