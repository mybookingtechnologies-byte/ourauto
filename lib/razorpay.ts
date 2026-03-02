export type RazorpayScaffoldOrder = {
  amount: number;
  currency: string;
  notes?: Record<string, string>;
};

export function createRazorpayOrderScaffold(input: RazorpayScaffoldOrder): RazorpayScaffoldOrder {
  return {
    amount: input.amount,
    currency: input.currency,
    notes: input.notes,
  };
}
