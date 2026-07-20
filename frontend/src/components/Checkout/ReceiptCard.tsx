import { forwardRef } from 'react';
import { OrderLineItem } from '../../store/selectors';
import { swatchStyle } from '../../lib/color';
import { fmt } from '../../lib/pricing';

export interface ReceiptCardProps {
  brandName: string;
  orderNo: string;
  lineItems: OrderLineItem[];
  gifts?: string[];
  customerName?: string;
  contactValue?: string;
  subtotalTwd: number;
  discountCode?: string;
  discountAmountTwd?: number;
  totalTwd: number;
}

// Fixed-width, print-style layout captured verbatim into a PNG by
// ShareImageButton (via html2canvas) - kept visually self-contained
// (its own header/footer, no dependence on page chrome) since it's meant
// to be screenshotted/downloaded and read on its own, e.g. inside a LINE chat.
const ReceiptCard = forwardRef<HTMLDivElement, ReceiptCardProps>(function ReceiptCard(
  { brandName, orderNo, lineItems, gifts, customerName, contactValue, subtotalTwd, discountCode, discountAmountTwd, totalTwd },
  ref,
) {
  const hasDiscount = Boolean(discountCode) && (discountAmountTwd ?? 0) > 0;

  return (
    <div ref={ref} className="w-[480px] bg-white p-7 font-body text-ink">
      <div className="mb-5 border-b-2 border-ink pb-4 text-center">
        <div className="font-display text-lg font-semibold uppercase tracking-wide">{brandName}</div>
        <div className="mt-1 font-mono text-[11px] text-ink-dim">BCD 客製化規格單</div>
        <div className="mt-2 font-mono text-xs text-teal">訂單編號 {orderNo}</div>
      </div>

      {(customerName || contactValue) && (
        <div className="mb-4 flex flex-col space-y-0.5 text-[12.5px] text-ink-dim">
          {customerName && <div>姓名：{customerName}</div>}
          {contactValue && <div>LINE ID／電話：{contactValue}</div>}
        </div>
      )}

      <div className="flex flex-col space-y-2.5">
        {lineItems.map((line, i) => (
          <div key={`${line.option.id}-${i}`} className="flex items-center space-x-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-line bg-white">
              {line.option.img || line.option.swatchImg ? (
                <img
                  src={line.option.img ?? line.option.swatchImg}
                  alt={line.option.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="h-5 w-5 rounded-[4px] border border-black/10" style={swatchStyle(line.option.name)} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-wide text-ink-dim">{line.stepLabel}</div>
              {/* No `truncate` (text-overflow:ellipsis + overflow:hidden) -
                  html2canvas has a documented bug where that combination
                  corrupts/garbles the rendered glyphs in a canvas capture,
                  even for text that isn't actually being clipped. This is a
                  static receipt image, not interactive UI, so a long name
                  wrapping to a second line is an acceptable trade-off. */}
              <div className="text-[13px] font-medium leading-snug">
                {line.groupLabel ? `${line.groupLabel}-${line.option.name}` : line.option.name}
                {line.quantity > 1 ? ` ×${line.quantity}` : ''}
              </div>
            </div>
            <div className="whitespace-nowrap font-mono text-[12.5px] text-teal">NT${fmt(line.lineTotalTwd)}</div>
          </div>
        ))}
      </div>

      {gifts && gifts.length > 0 && (
        <div className="mt-3.5 border-t border-line pt-3.5">
          {/* "附贈" now appears exactly once as a section label, followed by
              a plain text line of gift names - the per-item badge kept
              hitting html2canvas vertical-alignment bugs no matter how it
              was built (flex, inline-block, table-cell), so this sidesteps
              the whole problem by not needing to vertically align two
              differently-sized inline pieces per item at all. */}
          <div className="mb-1 rounded-sm bg-signal px-2 py-1 text-[10.5px] font-bold text-white" style={{ display: 'inline-block' }}>
            附贈
          </div>
          <div className="text-[12.5px] text-ink">{gifts.join('、')}</div>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-3.5">
        <div className="flex justify-between text-[12.5px] text-ink-dim">
          <span>小計</span>
          <span className="font-mono">NT${fmt(subtotalTwd)}</span>
        </div>
        {hasDiscount && (
          <div className="mt-1 flex justify-between text-[12.5px] text-signal">
            <span>折扣碼（{discountCode}）</span>
            <span className="font-mono">-NT${fmt(discountAmountTwd as number)}</span>
          </div>
        )}
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
          <span className="font-semibold">總計</span>
          <span className="font-mono text-xl font-bold">NT${fmt(totalTwd)}</span>
        </div>
      </div>

      <div className="mt-5 text-center text-[10.5px] text-ink-dim">想確認庫存、實際定價與交期，麻煩教練協助 🙏</div>
    </div>
  );
});

export default ReceiptCard;
