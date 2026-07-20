import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { twd } from '../lib/pricing';

// Returns the same priceRMB -> TWD conversion every component needs
// (swatch tiles, spec rows, checkout total) so it's computed from a single
// pricingConfig snapshot instead of each component re-deriving it.
export function usePriceTwd() {
  const pricingConfig = useConfiguratorStore((s) => s.pricingConfig);
  return (priceRMB: number): number => {
    if (!pricingConfig) return 0;
    return twd(priceRMB, pricingConfig.exchangeRate, pricingConfig.markupMultiplier);
  };
}
