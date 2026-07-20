import { Step, StepGroup, StepOption, PricingConfig, CreateOrderItemPayload } from '../types';
import { twd } from '../lib/pricing';
import { WEIGHT_GROUP_META } from '../lib/schematicConstants';

export interface GroupTab {
  key: string; // group id to select on click - the first member, for merged tabs
  label: string;
  tagline?: string;
  memberIds: string[]; // all group ids this tab represents (>1 when parentLabel-merged)
}

// Groups sharing the same parentLabel collapse into a single tab (e.g. STA's
// "3mm輕量化鋁板"/"3mm鋁板"/"2mm鋁板" all merge into one "鋁板" tab), so the
// user picks a material first, then sees every spec under it at once,
// instead of the specs appearing as separate top-level tabs.
export function buildGroupTabs(groups: StepGroup[]): GroupTab[] {
  const tabs: GroupTab[] = [];
  const seenParents = new Set<string>();
  for (const group of groups) {
    if (group.parentLabel) {
      if (seenParents.has(group.parentLabel)) continue;
      seenParents.add(group.parentLabel);
      const members = groups.filter((g) => g.parentLabel === group.parentLabel);
      tabs.push({ key: members[0].id, label: group.parentLabel, memberIds: members.map((g) => g.id) });
    } else {
      tabs.push({ key: group.id, label: group.label, tagline: group.tagline, memberIds: [group.id] });
    }
  }
  return tabs;
}

// All group ids that should be shown together for the currently active
// group - just itself normally, or every sibling sharing its parentLabel.
export function getSiblingGroupIds(groups: StepGroup[], activeGroupId: string | undefined): string[] {
  if (!activeGroupId) return [];
  const active = groups.find((g) => g.id === activeGroupId);
  if (!active?.parentLabel) return [activeGroupId];
  return groups.filter((g) => g.parentLabel === active.parentLabel).map((g) => g.id);
}

export interface WeightCartEntry {
  option: StepOption;
  qty: number;
}

export function getWeightStep(steps: Step[]): Step | undefined {
  return steps.find((s) => s.id === 'weight');
}

export function getTankStep(steps: Step[]): Step | undefined {
  return steps.find((s) => s.id === 'tank');
}

// Not shown in the main configurator accordion (StepList filters it out) -
// only surfaced via AddonUpsellModal, right before checkout.
export function getAddonStep(steps: Step[]): Step | undefined {
  return steps.find((s) => s.id === 'addon');
}

export function weightDisplayName(option: StepOption): string {
  const meta = option.group ? WEIGHT_GROUP_META[option.group] : undefined;
  return meta ? `${meta.weightLabel}${option.name}${meta.styleLabel}` : option.name;
}

// Shared by weightCartEntries()/addonCartEntries() - both are "multi-select
// with quantities" steps (unlike every other step, which is a single
// selectOption() pick), so they read out of a cart Record<optionId, qty>
// instead of `selections`.
function cartEntriesForStep(step: Step | undefined, cart: Record<string, number>): WeightCartEntry[] {
  if (!step) return [];
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({
      option: step.options.find((o) => o.id === id) as StepOption,
      qty,
    }))
    .filter((entry) => entry.option !== undefined);
}

// Ported from weightCartEntries() - sorted insertion order isn't guaranteed
// by Object.entries in the original either, callers that need "largest qty
// first" (updateSchematic's tie-break) sort separately, same as legacy code.
export function weightCartEntries(steps: Step[], weightCart: Record<string, number>): WeightCartEntry[] {
  return cartEntriesForStep(getWeightStep(steps), weightCart);
}

export function addonCartEntries(steps: Step[], addonCart: Record<string, number>): WeightCartEntry[] {
  return cartEntriesForStep(getAddonStep(steps), addonCart);
}

export function weightCartCapacityKg(entries: WeightCartEntry[]): number {
  const raw = entries.reduce(
    (sum, { option, qty }) => sum + (option.capacity !== undefined ? option.capacity : option.weight || 0) * qty,
    0,
  );
  return Math.round(raw * 100) / 100;
}

export interface SpecRow {
  label: string;
  subLabel?: string; // step's Chinese sub-name, always rendered on its own line below label
  name: string;
  priceRMB: number;
  weight: number | null;
  twdOverride?: number;
  gift?: string; // bundled freebie name, shown as a sub-line under this row
  isGiftRow?: boolean; // whole row is a standalone freebie - label renders as the same orange pill as `gift`
}

// Bundled freebies that ship with a given step's selection regardless of
// which option is chosen (e.g. every backplate includes the harness strap,
// every STA includes its mounting screws) - not a purchasable option, so
// there's no SKU/price, just a "贈送" line surfaced next to that step's spec row.
const STEP_GIFTS: Record<string, string> = {
  wing: '充排氣閥、高壓軟管',
  backplate: '背負帶',
  sta: 'STA氣瓶板螺絲*2',
};

// Standalone freebie not tied to any step's selection - see computeTotals().
const STANDALONE_GIFTS = ['BCD收納袋'];

// Flat list of every gift name that applies to the current selections -
// same STEP_GIFTS/STANDALONE_GIFTS data computeTotals() attaches to spec
// rows, but as plain strings for screens that show gifts as their own
// section (checkout review, the downloadable receipt image) instead of
// inline under each option row.
export function getGiftItems(steps: Step[], selections: Record<string, string>): string[] {
  const gifts = steps.filter((step) => selections[step.id] && STEP_GIFTS[step.id]).map((step) => STEP_GIFTS[step.id]);
  if (gifts.length > 0) gifts.push(...STANDALONE_GIFTS);
  return gifts;
}

export interface Totals {
  totalTwd: number;
  weightKg: number;
  selectedCount: number;
  missingWeightCount: number;
  specs: SpecRow[];
}

const EMPTY_TOTALS: Totals = { totalTwd: 0, weightKg: 0, selectedCount: 0, missingWeightCount: 0, specs: [] };

// Ported from the totals-accumulation loop inside render() (~line 1005-1043).
export function computeTotals(
  steps: Step[],
  selections: Record<string, string>,
  weightCart: Record<string, number>,
  addonCart: Record<string, number>,
  tankB: string | null,
  pricingConfig: PricingConfig | null,
): Totals {
  if (!pricingConfig) return EMPTY_TOTALS;
  const { exchangeRate, markupMultiplier } = pricingConfig;
  const priceTwd = (rmb: number) => twd(rmb, exchangeRate, markupMultiplier);

  let totalTwd = 0;
  let weightKg = 0;
  let selectedCount = 0;
  let missingWeightCount = 0;
  const specs: SpecRow[] = [];

  for (const step of steps) {
    if (step.id === 'tank') {
      const optA = step.options.find((o) => o.id === selections[step.id]);
      const optB = step.options.find((o) => o.id === tankB);
      const tankSlots: [StepOption | undefined, string][] = [
        [optA, '① 第一條'],
        [optB, '② 第二條'],
      ];
      tankSlots.forEach(([option, tag]) => {
        if (!option) return;
        totalTwd += priceTwd(option.priceRMB);
        if (option.weight === null || option.weight === undefined) missingWeightCount++;
        else weightKg += option.weight;
        specs.push({ label: `${step.title} ${tag}`, subLabel: step.sub, name: option.name, priceRMB: option.priceRMB, weight: option.weight });
      });
      selectedCount++;
      continue;
    }

    if (step.id === 'weight') {
      const entries = weightCartEntries(steps, weightCart);
      if (entries.length === 0) {
        specs.push({ label: step.title, subLabel: step.sub, name: '尚未選擇', priceRMB: 0, weight: 0, twdOverride: 0 });
      } else {
        entries.forEach(({ option, qty }) => {
          const unitTwd = priceTwd(option.priceRMB);
          const lineTwd = unitTwd * qty;
          const lineWeight = Math.round((option.weight || 0) * qty * 100) / 100;
          totalTwd += lineTwd;
          weightKg += lineWeight;
          specs.push({
            label: step.title,
            subLabel: step.sub,
            name: `${weightDisplayName(option)} ×${qty}`,
            priceRMB: option.priceRMB,
            weight: lineWeight,
            twdOverride: lineTwd,
          });
        });
      }
      selectedCount++;
      continue;
    }

    if (step.id === 'addon') {
      // Optional add-on cart (see AddonUpsellModal) - unlike weight, an
      // empty cart just means "skipped the upsell", so no placeholder row
      // and no contribution to selectedCount (it's not one of the "did you
      // finish every step" categories).
      addonCartEntries(steps, addonCart).forEach(({ option, qty }) => {
        const unitTwd = priceTwd(option.priceRMB);
        const lineTwd = unitTwd * qty;
        totalTwd += lineTwd;
        specs.push({
          label: step.title,
          subLabel: step.sub,
          name: `${option.name} ×${qty}`,
          priceRMB: option.priceRMB,
          weight: null,
          twdOverride: lineTwd,
        });
      });
      continue;
    }

    const option = step.options.find((o) => o.id === selections[step.id]);
    if (!option) continue;
    totalTwd += priceTwd(option.priceRMB);
    if (option.weight === null || option.weight === undefined) missingWeightCount++;
    else weightKg += option.weight;
    selectedCount++;
    specs.push({
      label: step.title,
      subLabel: step.sub,
      name: option.name,
      priceRMB: option.priceRMB,
      weight: option.weight,
      gift: STEP_GIFTS[step.id],
    });
  }

  // Standalone freebie not tied to any single step's selection - always
  // included with an order, so it's appended once at the end of the list
  // rather than attached to a particular row via STEP_GIFTS.
  if (specs.length > 0) {
    specs.push({ label: '附贈', name: 'BCD收納袋', priceRMB: 0, weight: null, twdOverride: 0, isGiftRow: true });
    missingWeightCount++;
  }

  return { totalTwd, weightKg, selectedCount, missingWeightCount, specs };
}

// Ported from updateSchematic() (~line 596-625): resolves which option
// "name" (the string colorFor()/paletteFor() match against) should paint a
// given schematic part. Returns null when the part has nothing to draw yet
// (e.g. weight cart is empty).
export function getPartFillName(
  part: string,
  steps: Step[],
  selections: Record<string, string>,
  weightCart: Record<string, number>,
  tankB: string | null,
): string | null {
  if (part === 'tank-a' || part === 'tank-b') {
    const tankStep = getTankStep(steps);
    if (!tankStep) return null;
    const id = part === 'tank-a' ? selections.tank : tankB;
    return tankStep.options.find((o) => o.id === id)?.name ?? null;
  }
  if (part === 'weight') {
    const entries = weightCartEntries(steps, weightCart);
    if (entries.length === 0) return null;
    // tie-break: largest quantity wins, matching entries.sort((a,b)=>b.qty-a.qty)[0]
    return [...entries].sort((a, b) => b.qty - a.qty)[0].option.name;
  }
  const step = steps.find((s) => s.part === part);
  if (!step) return null;
  return step.options.find((o) => o.id === selections[step.id])?.name ?? null;
}

// Builds the POST /api/orders payload. Aggregates by SKU (Map, not a plain
// per-step list) because the backend rejects duplicate optionSku entries -
// this matters concretely for TANK BAND when tankLinked=true, where both
// straps resolve to the same SKU and must be sent as one line with qty 2.
export function buildOrderItems(
  steps: Step[],
  selections: Record<string, string>,
  weightCart: Record<string, number>,
  addonCart: Record<string, number>,
  tankB: string | null,
): CreateOrderItemPayload[] {
  const qtyBySku = new Map<string, number>();
  const add = (sku: string | undefined, qty: number) => {
    if (!sku) return;
    qtyBySku.set(sku, (qtyBySku.get(sku) ?? 0) + qty);
  };

  for (const step of steps) {
    if (step.id === 'tank') {
      add(selections[step.id], 1);
      add(tankB ?? undefined, 1);
    } else if (step.id === 'weight') {
      for (const [optionId, qty] of Object.entries(weightCart)) {
        if (qty > 0) add(optionId, qty);
      }
    } else if (step.id === 'addon') {
      for (const [optionId, qty] of Object.entries(addonCart)) {
        if (qty > 0) add(optionId, qty);
      }
    } else {
      add(selections[step.id], 1);
    }
  }

  return Array.from(qtyBySku.entries()).map(([optionSku, quantity]) => ({ optionSku, quantity }));
}

export interface OrderLineItem {
  option: StepOption;
  stepLabel: string;
  // The specific group's label (e.g. STA's "2mm鋁板", WING's "18LBS") -
  // undefined for steps without groups (tank) or when the option's group id
  // doesn't resolve. Lets callers show "18LBS-黑色" instead of just "黑色",
  // which is ambiguous once multiple groups share simple color names.
  groupLabel?: string;
  quantity: number;
  unitPriceTwd: number;
  lineTotalTwd: number;
}

function findGroupLabel(step: Step, groupId: string | undefined): string | undefined {
  return groupId ? step.groups?.find((g) => g.id === groupId)?.label : undefined;
}

// Like computeTotals(), but returns the full StepOption (so callers can show
// its photo/swatch) instead of a flattened label/name string - used by the
// checkout and confirmation screens, which display each line as a photo tile
// rather than a text row.
export function getOrderLineItems(
  steps: Step[],
  selections: Record<string, string>,
  weightCart: Record<string, number>,
  addonCart: Record<string, number>,
  tankB: string | null,
  priceTwd: (priceRMB: number) => number,
): OrderLineItem[] {
  const lines: OrderLineItem[] = [];

  for (const step of steps) {
    if (step.id === 'tank') {
      const optA = step.options.find((o) => o.id === selections[step.id]);
      const optB = step.options.find((o) => o.id === tankB);
      if (optA && optB) {
        if (optA.id === optB.id) {
          const unitPriceTwd = priceTwd(optA.priceRMB);
          lines.push({
            option: optA,
            stepLabel: step.title,
            groupLabel: findGroupLabel(step, optA.group),
            quantity: 2,
            unitPriceTwd,
            lineTotalTwd: unitPriceTwd * 2,
          });
        } else {
          const unitA = priceTwd(optA.priceRMB);
          const unitB = priceTwd(optB.priceRMB);
          lines.push({
            option: optA,
            stepLabel: `${step.title}（第一條）`,
            groupLabel: findGroupLabel(step, optA.group),
            quantity: 1,
            unitPriceTwd: unitA,
            lineTotalTwd: unitA,
          });
          lines.push({
            option: optB,
            stepLabel: `${step.title}（第二條）`,
            groupLabel: findGroupLabel(step, optB.group),
            quantity: 1,
            unitPriceTwd: unitB,
            lineTotalTwd: unitB,
          });
        }
      }
      continue;
    }

    if (step.id === 'weight') {
      for (const { option, qty } of weightCartEntries(steps, weightCart)) {
        const unitPriceTwd = priceTwd(option.priceRMB);
        lines.push({
          option,
          stepLabel: step.title,
          groupLabel: findGroupLabel(step, option.group),
          quantity: qty,
          unitPriceTwd,
          lineTotalTwd: unitPriceTwd * qty,
        });
      }
      continue;
    }

    if (step.id === 'addon') {
      for (const { option, qty } of addonCartEntries(steps, addonCart)) {
        const unitPriceTwd = priceTwd(option.priceRMB);
        lines.push({
          option,
          stepLabel: step.title,
          quantity: qty,
          unitPriceTwd,
          lineTotalTwd: unitPriceTwd * qty,
        });
      }
      continue;
    }

    const option = step.options.find((o) => o.id === selections[step.id]);
    if (!option) continue;
    const unitPriceTwd = priceTwd(option.priceRMB);
    lines.push({
      option,
      stepLabel: step.title,
      groupLabel: findGroupLabel(step, option.group),
      quantity: 1,
      unitPriceTwd,
      lineTotalTwd: unitPriceTwd,
    });
  }

  return lines;
}
