import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { computeTotals, getGiftItems, getOrderLineItems } from '../../store/selectors';
import { fmt } from '../../lib/pricing';
import { buildLineDirectChatUrl, buildLineShareUrl, openLineUrl } from '../../lib/lineShare';
import { buildOrderSummaryText } from '../../lib/orderSummary';
import OrderSummaryList from './OrderSummaryList';
import GiftItemsList from './GiftItemsList';
import ShareImageButton from './ShareImageButton';

const LINE_URL = import.meta.env.VITE_LINE_URL;
const BRAND_NAME = import.meta.env.VITE_BRAND_NAME ?? 'BCD 客製化配置器';

// The final "輸出一個畫面" (output screen) requested: everything the
// customer picked (with photos), the coupon that was used, and the total
// after discount - then a direct path to hand it all to the instructor
// via LINE. Reads the still-current configurator selections (untouched by
// checkout) rather than re-fetching the order, so photos render the same
// way they did on the checkout review step.
export default function ConfirmationPage() {
  const steps = useConfiguratorStore((s) => s.steps);
  const selections = useConfiguratorStore((s) => s.selections);
  const weightCart = useConfiguratorStore((s) => s.weightCart);
  const addonCart = useConfiguratorStore((s) => s.addonCart);
  const tankB = useConfiguratorStore((s) => s.tankB);
  const lastOrder = useConfiguratorStore((s) => s.lastOrder);
  const lastContact = useConfiguratorStore((s) => s.lastContact);
  const goToConfigurator = useConfiguratorStore((s) => s.goToConfigurator);

  const lineItems = getOrderLineItems(steps, selections, weightCart, addonCart, tankB);
  const totals = computeTotals(steps, selections, weightCart, addonCart, tankB);
  const gifts = getGiftItems(steps, selections);

  if (!lastOrder) {
    // Direct navigation / refresh with no order in memory - send back
    // rather than show a confirmation screen with nothing to confirm.
    goToConfigurator();
    return null;
  }

  const hasDiscount = Boolean(lastOrder.discountCode) && lastOrder.discountAmountTwd > 0;
  const summaryText = buildOrderSummaryText(
    BRAND_NAME,
    lastOrder.orderNo,
    totals,
    hasDiscount ? { code: lastOrder.discountCode as string, amountTwd: lastOrder.discountAmountTwd, totalTwd: lastOrder.totalPriceTwd } : undefined,
  );

  function handleShareToLine() {
    openLineUrl(buildLineShareUrl(summaryText));
  }

  async function handleOpenDirectChat() {
    if (!LINE_URL) return;
    try {
      await navigator.clipboard.writeText(summaryText);
    } catch {
      // best-effort only - direct chat still opens even if clipboard write fails
    }
    openLineUrl(buildLineDirectChatUrl(LINE_URL));
  }

  return (
    <div className="mx-auto max-w-[720px] pb-16">
      <div className="mb-6 rounded-sm border border-ok/40 bg-ok/10 p-5 text-center">
        <div className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ok text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-5 w-5">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-xl uppercase tracking-wide text-ink">訂單已送出</h1>
        <div className="mt-1 font-mono text-sm text-ink-dim">訂單編號 {lastOrder.orderNo}</div>
      </div>

      {(lastContact?.customerName || lastContact?.contactValue) && (
        <section className="mb-6 rounded-sm border border-line bg-panel p-4">
          <h2 className="mb-2.5 font-mono text-[11px] uppercase tracking-wide text-teal">聯絡資訊</h2>
          <div className="flex flex-col gap-1 text-[13px] text-ink">
            {lastContact.customerName && <div>姓名：{lastContact.customerName}</div>}
            {lastContact.contactValue && <div>LINE ID／電話：{lastContact.contactValue}</div>}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2.5 font-mono text-[11px] uppercase tracking-wide text-teal">您的選擇（共 {lineItems.length} 項）</h2>
        <OrderSummaryList lineItems={lineItems} />
      </section>

      {gifts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2.5 font-mono text-[11px] uppercase tracking-wide text-teal">附贈項目</h2>
          <GiftItemsList gifts={gifts} />
        </section>
      )}

      <section className="rounded-sm border border-line bg-panel p-4">
        <div className="flex justify-between text-[13px] text-ink-dim">
          <span>小計</span>
          <span className="font-mono">NT${fmt(lastOrder.subtotalPriceTwd)}</span>
        </div>
        {hasDiscount && (
          <div className="mt-1.5 flex justify-between text-[13px] text-signal">
            <span>折扣碼（{lastOrder.discountCode}）</span>
            <span className="font-mono">-NT${fmt(lastOrder.discountAmountTwd)}</span>
          </div>
        )}
        <div className="mt-2.5 flex items-baseline justify-between border-t border-line pt-2.5">
          <span className="font-semibold text-ink">總計</span>
          <span className="font-mono text-2xl font-bold text-ok">NT${fmt(lastOrder.totalPriceTwd)}</span>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={handleShareToLine}
          className="flex-1 rounded-sm border border-line px-4 py-3 text-[13.5px] font-semibold text-ink hover:border-teal"
        >
          分享規格到 LINE
        </button>
        {LINE_URL && (
          <button
            type="button"
            onClick={handleOpenDirectChat}
            className="flex-1 rounded-sm border border-signal bg-signal px-4 py-3 text-[13.5px] font-semibold text-[#1a0e08] hover:bg-[#ff7d54]"
          >
            親自聯絡教練確認
          </button>
        )}
      </div>

      <div className="mt-3">
        <ShareImageButton
          orderId={lastOrder.orderId}
          brandName={BRAND_NAME}
          orderNo={lastOrder.orderNo}
          lineItems={lineItems}
          gifts={gifts}
          customerName={lastContact?.customerName}
          contactValue={lastContact?.contactValue}
          subtotalTwd={lastOrder.subtotalPriceTwd}
          discountCode={hasDiscount ? lastOrder.discountCode : undefined}
          discountAmountTwd={hasDiscount ? lastOrder.discountAmountTwd : undefined}
          totalTwd={lastOrder.totalPriceTwd}
        />
      </div>

      <button
        type="button"
        onClick={goToConfigurator}
        className="mt-3 w-full rounded-sm border border-line px-4 py-3 text-[13.5px] text-ink-dim hover:border-teal hover:text-ink"
      >
        繼續調整配置
      </button>
    </div>
  );
}
