import { useEffect } from 'react';
import { useConfiguratorStore } from './store/useConfiguratorStore';
import SchematicViewer from './components/SchematicViewer/SchematicViewer';
import SummaryPanel from './components/SchematicViewer/SummaryPanel';
import StepList from './components/StepList/StepList';
import CheckoutBar from './components/CheckoutBar/CheckoutBar';
import CheckoutPage from './components/Checkout/CheckoutPage';
import ConfirmationPage from './components/Checkout/ConfirmationPage';

const BRAND_NAME = import.meta.env.VITE_BRAND_NAME ?? 'BCD 客製化配置器';

export default function App() {
  const steps = useConfiguratorStore((s) => s.steps);
  const isLoading = useConfiguratorStore((s) => s.isLoading);
  const loadError = useConfiguratorStore((s) => s.loadError);
  const loadCatalog = useConfiguratorStore((s) => s.loadCatalog);
  const view = useConfiguratorStore((s) => s.view);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-4">
          <span className="font-display text-[15px] font-semibold uppercase tracking-wide">{BRAND_NAME}</span>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-6 py-8">
        {loadError && (
          <div className="mb-6 rounded-sm border border-signal-dim bg-signal-dim/20 p-4 text-sm text-ink">
            商品資料載入失敗：{loadError}
            <button type="button" onClick={() => loadCatalog()} className="ml-3 underline">
              重試
            </button>
          </div>
        )}

        {isLoading && steps.length === 0 && !loadError && (
          <div className="py-24 text-center text-ink-dim">載入配置選項中…</div>
        )}

        {steps.length > 0 && view === 'configurator' && (
          <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[420px_1fr]">
            {/* max-h + overflow-y-auto: schematic + summary combined can be
                taller than the viewport once several spec rows are filled
                in, so the column scrolls internally instead of pinning at
                top-92 and running its overflow off past the visible area. */}
            <div className="md:sticky md:top-[92px] md:max-h-[calc(100vh-112px)] md:overflow-y-auto">
              <SchematicViewer />
              <SummaryPanel />
            </div>
            <StepList />
          </div>
        )}

        {steps.length > 0 && view === 'checkout' && <CheckoutPage />}
        {view === 'confirmation' && <ConfirmationPage />}
      </div>

      {steps.length > 0 && view === 'configurator' && <CheckoutBar />}
    </div>
  );
}
