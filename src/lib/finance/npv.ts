export interface NpvInput {
  initialInvestment: number;
  discountRate: number;
  cashFlows: string;
}

export type NpvValidationError = "initialInvestment" | "discountRate" | "cashFlows";

export function parseCashFlows(value: string): number[] | null {
  const tokens = value.split(",").map((token) => token.trim());
  if (tokens.length === 0 || tokens.some((token) => token === "")) return null;

  const flows = tokens.map(Number);
  return flows.every(Number.isFinite) ? flows : null;
}

export function validateNpvInput(input: NpvInput): NpvValidationError | null {
  if (!Number.isFinite(input.initialInvestment) || input.initialInvestment < 0) return "initialInvestment";
  if (!Number.isFinite(input.discountRate) || input.discountRate <= -100) return "discountRate";
  if (!parseCashFlows(input.cashFlows)) return "cashFlows";
  return null;
}

export function calculateNpv(input: NpvInput): number | null {
  if (validateNpvInput(input)) return null;
  const flows = parseCashFlows(input.cashFlows);
  if (!flows) return null;

  return flows.reduce(
    (npv, cashFlow, index) => npv + cashFlow / Math.pow(1 + input.discountRate / 100, index + 1),
    -input.initialInvestment
  );
}
