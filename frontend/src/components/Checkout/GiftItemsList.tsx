interface GiftItemsListProps {
  gifts: string[];
}

// Shared between CheckoutPage and ConfirmationPage - lists the bundled
// freebies (harness strap, STA screws, BCD收納袋, ...) that don't have their
// own SKU/photo so they can't appear in OrderSummaryList's line items.
export default function GiftItemsList({ gifts }: GiftItemsListProps) {
  if (gifts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {gifts.map((gift) => (
        <span
          key={gift}
          className="inline-flex items-center gap-1.5 rounded-sm border border-signal/30 bg-signal/5 py-1.5 pl-1.5 pr-2.5 text-[13px]"
        >
          <span className="rounded-full bg-signal px-1.5 py-0.5 text-[10px] font-bold text-white">附贈</span>
          <span className="font-medium text-ink">{gift}</span>
        </span>
      ))}
    </div>
  );
}
