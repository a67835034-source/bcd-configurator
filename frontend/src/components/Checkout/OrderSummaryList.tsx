import { useState } from 'react';
import { OrderLineItem } from '../../store/selectors';
import { swatchStyle } from '../../lib/color';
import { fmt } from '../../lib/pricing';

interface OrderSummaryListProps {
  lineItems: OrderLineItem[];
}

// Shared between CheckoutPage (pre-submit review) and ConfirmationPage
// (post-submit receipt) - one row per selected option, with its photo when
// available so "所有的選項（包含圖片）" shows up the same way on both screens.
export default function OrderSummaryList({ lineItems }: OrderSummaryListProps) {
  return (
    <div className="flex flex-col gap-2">
      {lineItems.map((line, i) => (
        <OrderLineItemRow key={`${line.option.id}-${i}`} line={line} />
      ))}
    </div>
  );
}

function OrderLineItemRow({ line }: { line: OrderLineItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoSrc = line.option.img ?? line.option.swatchImg;
  const showPhoto = Boolean(photoSrc) && !imageFailed;

  return (
    <div className="flex items-center gap-3 rounded-sm border border-line bg-panel-raised p-2.5">
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-line bg-white">
        {showPhoto ? (
          <img
            src={photoSrc}
            alt={line.option.name}
            onError={() => setImageFailed(true)}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="h-6 w-6 rounded-[4px] border border-black/10" style={swatchStyle(line.option.name)} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[11px] uppercase tracking-wide text-ink-dim">{line.stepLabel}</div>
        <div className="truncate text-[13.5px] font-medium">
          {line.option.name}
          {line.quantity > 1 ? ` ×${line.quantity}` : ''}
        </div>
      </div>
      <div className="whitespace-nowrap font-mono text-[13px] text-teal">NT${fmt(line.lineTotalTwd)}</div>
    </div>
  );
}
