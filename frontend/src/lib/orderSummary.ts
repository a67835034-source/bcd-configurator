import { Totals } from '../store/selectors';
import { fmt } from './pricing';

// Text formatting ported from buildSummaryText() (~line 1135-1170), now fed
// by the already-computed Totals (see store/selectors.ts) and stamped with
// the real order number once one exists, instead of being a client-side-only
// throwaway string.
//
// priceTwd converts a spec's priceRMB when the row doesn't already carry a
// computed twdOverride (weight-cart rows and the "尚未選擇" placeholder set
// twdOverride directly; every other row needs the live exchange rate).
//
// discount, when present, appends the applied coupon + final total after
// discount (order-confirmation flow); omitted entirely for the pre-checkout
// share text, which only ever shows the plain subtotal.
export function buildOrderSummaryText(
  brandName: string,
  orderNo: string,
  totals: Totals,
  priceTwd: (priceRMB: number) => number,
  discount?: { code: string; amountTwd: number; totalTwd: number },
): string {
  const lines = [`【${brandName}｜BCD 客製化規格】`, `訂單編號：${orderNo}`, ''];

  for (const spec of totals.specs) {
    if (spec.name === '尚未選擇') {
      lines.push(`${spec.label}：尚未選擇`);
      continue;
    }
    const twd = spec.twdOverride !== undefined ? spec.twdOverride : priceTwd(spec.priceRMB);
    lines.push(`${spec.label}：${spec.name}　NT$${fmt(twd)}`);
  }

  lines.push('', `裝備廠商標示總重量（約）：${totals.weightKg.toFixed(2)} kg（未含未標示重量之品項）`, `小計：NT$${fmt(totals.totalTwd)}（成本參考價）`);

  if (discount) {
    lines.push(`折扣碼：${discount.code}（-NT$${fmt(discount.amountTwd)}）`, `折扣後總價：NT$${fmt(discount.totalTwd)}`);
  }

  lines.push('', '想確認庫存、實際定價與交期，麻煩教練協助 🙏');
  return lines.join('\n');
}
