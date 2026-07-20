import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { computeTotals } from '../../store/selectors';
import { fmt } from '../../lib/pricing';
import AddonUpsellModal from './AddonUpsellModal';

// Sticky summary bar shown while browsing the configurator. Order
// submission, the coupon field, and the LINE hand-off now live on the
// dedicated CheckoutPage/ConfirmationPage screens (see goToCheckout()) -
// this bar's only job is showing the running total and getting there. "前往
// 結帳" opens the add-on upsell modal first rather than navigating directly
// (see openAddonUpsell()).
export default function CheckoutBar() {
  const steps = useConfiguratorStore((s) => s.steps);
  const selections = useConfiguratorStore((s) => s.selections);
  const weightCart = useConfiguratorStore((s) => s.weightCart);
  const addonCart = useConfiguratorStore((s) => s.addonCart);
  const tankB = useConfiguratorStore((s) => s.tankB);
  const pricingConfig = useConfiguratorStore((s) => s.pricingConfig);
  const showAddonModal = useConfiguratorStore((s) => s.showAddonModal);
  const openAddonUpsell = useConfiguratorStore((s) => s.openAddonUpsell);

  const { totalTwd, selectedCount } = computeTotals(steps, selections, weightCart, addonCart, tankB, pricingConfig);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/92 shadow-[0_-4px_16px_rgba(19,34,40,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-5 px-6 py-3">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-ink-dim">TOTAL 預估參考價・已選 {selectedCount} 項</div>
            <div className="font-mono text-[26px] font-semibold text-ink">
              NT$ <span>{fmt(totalTwd)}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={steps.length === 0 || selectedCount === 0}
            onClick={openAddonUpsell}
            className="inline-flex items-center gap-2 rounded-sm border border-signal bg-signal px-[22px] py-3 text-[13.5px] font-semibold text-[#1a0e08] hover:bg-[#ff7d54] disabled:cursor-not-allowed disabled:opacity-60"
          >
            前往結帳
          </button>
        </div>
      </div>
      {showAddonModal && <AddonUpsellModal />}
    </>
  );
}
