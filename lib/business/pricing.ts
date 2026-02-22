interface PriceInput {
  basePrice: number;
  year: number;
  km: number;
  modelFactor: number;
}

export function suggestPrice(input: PriceInput) {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - input.year);
  const ageDepreciation = age * 0.045;
  const kmImpact = (input.km / 10000) * 0.01;
  const modelPremium = input.modelFactor;

  const multiplier = Math.max(0.35, 1 - ageDepreciation - kmImpact + modelPremium);
  return Math.round(input.basePrice * multiplier);
}

export function computeConversionRate(chats: number, calls: number, views: number) {
  if (views <= 0) return 0;
  return Number((((chats + calls) / views) * 100).toFixed(2));
}