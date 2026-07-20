// Ported verbatim from 0711檔案.html (~line 495-503). The `priceTo99` step
// is not a cosmetic rounding choice - it's charm pricing (every TWD price
// ends in "99") and must produce byte-identical numbers to what the backend
// charges in POST /api/orders, or the price the customer configured won't
// match the price they're billed.

export function priceTo99(n: number): number {
  return Math.ceil((n + 1) / 100) * 100 - 1;
}

export function twd(priceRMB: number, exchangeRate: number, markupMultiplier: number): number {
  const raw = Math.round(priceRMB * exchangeRate * markupMultiplier);
  return priceTo99(raw);
}

export function fmt(n: number): string {
  return n.toLocaleString('en-US');
}
