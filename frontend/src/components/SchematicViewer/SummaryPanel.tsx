import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { computeTotals } from '../../store/selectors';
import { fmt } from '../../lib/pricing';

// Ported from the .readout-strip + #specList rendering inside render()
// (~line 1044-1063).
export default function SummaryPanel() {
  const steps = useConfiguratorStore((s) => s.steps);
  const selections = useConfiguratorStore((s) => s.selections);
  const weightCart = useConfiguratorStore((s) => s.weightCart);
  const addonCart = useConfiguratorStore((s) => s.addonCart);
  const tankB = useConfiguratorStore((s) => s.tankB);

  const { totalTwd, weightKg, selectedCount, missingWeightCount, specs } = computeTotals(
    steps,
    selections,
    weightCart,
    addonCart,
    tankB,
  );
  // addon is an optional upsell step, not one of the "did you finish every
  // category" steps selectedCount tracks against - excluded from this
  // denominator so it doesn't show e.g. "5/6" once everything else is done.
  const requiredStepCount = steps.filter((s) => s.id !== 'addon').length;

  return (
    <div className="mt-3.5 flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-4 rounded-sm border border-line bg-panel p-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-dim">裝備廠商標示總重量（約）</div>
          <div className="font-mono text-2xl font-semibold text-ink">
            {weightKg.toFixed(1)}
            <small className="ml-0.5 text-sm text-ink-dim">kg</small>
          </div>
          {missingWeightCount > 0 && (
            <div className="mt-0.5 text-[11px] text-ink-dim">＊ {missingWeightCount} 項未計入（廠商未標示重量）</div>
          )}
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-dim">已選部件</div>
          <div className="font-mono text-2xl font-semibold text-ink">
            {selectedCount}
            <small className="ml-0.5 text-sm text-ink-dim">/ {requiredStepCount}</small>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-line bg-panel">
        {specs.map((sp, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-line px-4 py-2.5 text-[13px] last:border-b-0">
            <div className="w-20 flex-shrink-0 text-left text-ink-dim">
              {sp.isGiftRow ? (
                <span className="inline-flex flex-shrink-0 rounded-full bg-signal px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {sp.label}
                </span>
              ) : (
                <span className="block">{sp.label}</span>
              )}
              {sp.subLabel && <span className="block">{sp.subLabel}</span>}
              {sp.gift && (
                <span className="mt-1 flex items-center gap-1 whitespace-nowrap">
                  <span className="flex-shrink-0 rounded-full bg-signal px-1.5 py-0.5 text-[11px] font-bold text-white">附贈</span>
                  <span className="text-[12px] font-medium text-ink">{sp.gift}</span>
                </span>
              )}
            </div>
            <div className="flex-1 text-right">
              <span className="block font-medium">{sp.name}</span>
              <span className="mt-0.5 block font-mono text-xs text-teal">
                NT${fmt(sp.twdOverride !== undefined ? sp.twdOverride : sp.priceTwd)}
              </span>
            </div>
            <div className="w-12 flex-shrink-0 pt-0.5 text-right font-mono text-[11px] text-ink-dim">
              {sp.weight === null || sp.weight === undefined ? '－' : `${sp.weight}kg`}
            </div>
          </div>
        ))}
        <div className="flex items-start gap-3 border-t-[1.5px] border-line bg-panel-raised px-4 py-2.5 text-[13px]">
          <div className="w-20 flex-shrink-0 font-semibold text-ink">小計</div>
          <div className="flex-1 text-right">
            <span className="block font-normal text-ink-dim">共 {specs.length} 項</span>
            <span className="mt-0.5 block font-mono text-sm font-bold text-signal">NT${fmt(totalTwd)}</span>
          </div>
          <div className="w-12 flex-shrink-0 pt-0.5 text-right font-mono text-[11px] font-semibold text-ink">
            {weightKg.toFixed(2)}kg
          </div>
        </div>
      </div>
    </div>
  );
}
