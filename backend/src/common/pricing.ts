/**
 * Ports the legacy frontend's twd()/priceTo99() pricing rule verbatim (see
 * 0711檔案.html, ~line 495). Every displayed/charged TWD price is rounded
 * UP to the nearest value ending in "99" (charm pricing), not just rounded
 * to the nearest integer.
 */
export function priceTo99(n: number): number {
  return Math.ceil((n + 1) / 100) * 100 - 1;
}

export function computeTwdPrice(
  priceRmb: number,
  exchangeRate: number,
  markupMultiplier: number,
): number {
  const raw = Math.round(priceRmb * exchangeRate * markupMultiplier);
  return priceTo99(raw);
}
