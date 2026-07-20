import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { weightCartCapacityKg, weightCartEntries, weightDisplayName } from '../../store/selectors';
import { fmt } from '../../lib/pricing';
import { usePriceTwd } from '../../hooks/usePriceTwd';

// Ported from weightCartSummaryHTML() (~line 877-896).
export default function WeightCartSummary() {
  const steps = useConfiguratorStore((s) => s.steps);
  const weightCart = useConfiguratorStore((s) => s.weightCart);
  const removeWeightItem = useConfiguratorStore((s) => s.removeWeightItem);
  const priceTwd = usePriceTwd();

  const entries = weightCartEntries(steps, weightCart);

  if (entries.length === 0) {
    return (
      <div className="mt-4 rounded-sm border border-dashed border-line p-3.5 text-center text-[12.5px] text-ink-dim">
        尚未選擇任何配重袋，請在上方點選數量，或輸入目標配重自動帶入。
      </div>
    );
  }

  const totalCapacity = weightCartCapacityKg(entries);
  const totalPairs = entries.reduce((sum, { qty }) => sum + qty, 0);
  const totalPrice = entries.reduce((sum, { option, qty }) => sum + priceTwd(option.priceRMB) * qty, 0);

  return (
    <div className="mt-4 overflow-hidden rounded-sm border border-line">
      {entries.map(({ option, qty }) => (
        <div key={option.id} className="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5 text-[13px] last:border-b-0">
          <button
            type="button"
            title="移除"
            onClick={() => removeWeightItem(option.id)}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-line bg-panel text-[11px] text-ink-dim hover:border-signal hover:bg-signal-dim/40 hover:text-signal"
          >
            ✕
          </button>
          <span className="flex-1 font-medium">{weightDisplayName(option)}</span>
          <span className="font-mono text-xs text-ink-dim">×{qty}</span>
          <span className="font-mono text-xs text-teal">NT${fmt(priceTwd(option.priceRMB) * qty)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-2.5 bg-panel-raised px-3.5 py-2.5 font-mono text-xs font-semibold text-ink">
        <span>合計 {totalPairs} 對</span>
        <span>最大可放重量 約{totalCapacity}kg</span>
        <span>NT${fmt(totalPrice)}</span>
      </div>
    </div>
  );
}
