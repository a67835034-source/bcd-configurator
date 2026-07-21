import { create } from 'zustand';
import { getProducts } from '../api/client';
import { OrderResponse, Step } from '../types';
import { PART_BEST_VIEW, VIEW_COUNT, WEIGHT_QUICK1_SKU, WEIGHT_QUICK2_SKU } from '../lib/schematicConstants';
import { getWeightStep } from './selectors';

export type AppView = 'configurator' | 'checkout' | 'confirmation';

interface ConfiguratorState {
  // catalog (from backend)
  steps: Step[];
  isLoading: boolean;
  loadError: string | null;

  // selections - replaces the legacy global `state` / `groupState` / `weightCart` / `tankB` / `tankLinked`
  selections: Record<string, string>; // stepId -> optionId
  groupSelections: Record<string, string>; // stepId -> groupId
  weightCart: Record<string, number>; // optionId -> qty
  addonCart: Record<string, number>; // optionId -> qty, for the pre-checkout upsell (see AddonUpsellModal)
  tankB: string | null;
  tankLinked: boolean;
  // Last value entered into "目標配重" - the legacy code never persisted
  // this either (read directly off the DOM input on click), but the new
  // checkout payload needs it as a real field, so it's tracked here.
  weightTargetKg: number | null;

  // Shown when "前往結帳" is clicked, before actually navigating to the
  // checkout view - lets the customer add optional upsell items (or
  // explicitly skip) as one last step before order review.
  showAddonModal: boolean;

  // UI - replaces the legacy `openStep` / `viewIndex`
  openStep: string | null;
  viewIndex: number;

  // Top-level screen: configurator (accordion) -> checkout (review + coupon)
  // -> confirmation (final receipt, post-submit). No router library needed
  // for 3 screens in a single-page app.
  view: AppView;
  lastOrder: OrderResponse | null;
  // OrderResponse (backend) has no customer/contact fields - carried
  // separately from the checkout form so the confirmation screen and
  // downloadable receipt can still show who the order is for.
  lastContact: { customerName?: string; contactValue?: string } | null;

  // Set once at app load by initLiff() (see lib/liff.ts) when the site opens
  // inside LINE's in-app browser - null in any other context. Sent along
  // with the order so the backend can verify it and push the receipt +
  // remittance info directly to this customer's own LINE account.
  liffIdToken: string | null;

  loadCatalog: () => Promise<void>;
  setLiffIdToken: (token: string | null) => void;
  goToCheckout: () => void;
  goToConfigurator: () => void;
  goToConfirmation: (order: OrderResponse, contact?: { customerName?: string; contactValue?: string }) => void;
  openStepId: (stepId: string) => void;
  selectGroup: (stepId: string, groupId: string) => void;
  selectOption: (stepId: string, optionId: string, slot?: 'a' | 'b') => void;
  setTankLinked: (linked: boolean) => void;
  incWeightQty: (optionId: string) => void;
  decWeightQty: (optionId: string) => void;
  removeWeightItem: (optionId: string) => void;
  autoFillWeight: (targetKg: number) => void;
  incAddonQty: (optionId: string) => void;
  decAddonQty: (optionId: string) => void;
  openAddonUpsell: () => void;
  skipAddonsAndCheckout: () => void;
  confirmAddonsAndCheckout: () => void;
  setView: (index: number) => void;
  rotateView: (delta: number) => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  steps: [],
  isLoading: false,
  loadError: null,

  selections: {},
  groupSelections: {},
  weightCart: {},
  addonCart: {},
  tankB: null,
  tankLinked: true,
  weightTargetKg: null,
  showAddonModal: false,

  openStep: null,
  viewIndex: 0,

  view: 'configurator',
  lastOrder: null,
  lastContact: null,
  liffIdToken: null,

  setLiffIdToken(token) {
    set({ liffIdToken: token });
  },

  async loadCatalog() {
    set({ isLoading: true, loadError: null });
    try {
      const steps = await getProducts();

      // Ported from the legacy initialization block (~line 794-807): pick
      // each step's `def` option (or the first one), seed groupSelections
      // for grouped steps, mirror tank's first slot into the second, and
      // seed the weight cart with qty 1 of the weight step's default SKU.
      const selections: Record<string, string> = {};
      const groupSelections: Record<string, string> = {};
      steps.forEach((step) => {
        const def = step.options.find((o) => o.def) ?? step.options[0];
        if (!def) return;
        selections[step.id] = def.id;
        if (step.groups && def.group) groupSelections[step.id] = def.group;
      });

      const weightStep = getWeightStep(steps);
      const weightDefault = weightStep?.options.find((o) => o.def);
      const weightCart = weightDefault ? { [weightDefault.id]: 1 } : {};

      set({
        steps,
        selections,
        groupSelections,
        weightCart,
        tankB: selections.tank ?? null,
        tankLinked: true,
        openStep: steps[0]?.id ?? null,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, loadError: err instanceof Error ? err.message : '無法載入商品資料' });
    }
  },

  openStepId(stepId) {
    set({ openStep: stepId });
    const step = get().steps.find((s) => s.id === stepId);
    if (step && PART_BEST_VIEW[step.part] !== undefined) {
      get().setView(PART_BEST_VIEW[step.part]);
    }
  },

  selectGroup(stepId, groupId) {
    set((s) => {
      const groupSelections = { ...s.groupSelections, [stepId]: groupId };
      let selections = s.selections;
      // Ported from the group-tab click handler (~line 1076-1088): weight
      // step keeps its multi-select cart untouched when switching tabs,
      // every other grouped step jumps to the first option in the new group.
      if (stepId !== 'weight') {
        const step = s.steps.find((st) => st.id === stepId);
        const firstInGroup = step?.options.find((o) => o.group === groupId);
        if (firstInGroup) selections = { ...s.selections, [stepId]: firstInGroup.id };
      }
      return { groupSelections, selections };
    });
  },

  selectOption(stepId, optionId, slot) {
    set((s) => {
      if (stepId === 'tank' && slot === 'b') {
        return { tankB: optionId, tankLinked: false };
      }
      if (stepId === 'tank') {
        return {
          selections: { ...s.selections, tank: optionId },
          tankB: s.tankLinked ? optionId : s.tankB,
        };
      }
      return { selections: { ...s.selections, [stepId]: optionId } };
    });
  },

  setTankLinked(linked) {
    set((s) => ({ tankLinked: linked, tankB: linked ? s.selections.tank : s.tankB }));
  },

  incWeightQty(optionId) {
    set((s) => ({ weightCart: { ...s.weightCart, [optionId]: (s.weightCart[optionId] ?? 0) + 1 } }));
  },

  decWeightQty(optionId) {
    set((s) => {
      const next = Math.max(0, (s.weightCart[optionId] ?? 0) - 1);
      const weightCart = { ...s.weightCart };
      if (next <= 0) delete weightCart[optionId];
      else weightCart[optionId] = next;
      return { weightCart };
    });
  },

  removeWeightItem(optionId) {
    set((s) => {
      const weightCart = { ...s.weightCart };
      delete weightCart[optionId];
      return { weightCart };
    });
  },

  // Ported verbatim from autoFillWeight() (~line 823-835): "smallest number
  // of pairs" greedy fill using fixed 1kg/2kg quick-release SKUs.
  autoFillWeight(targetKg) {
    const t = Math.max(0, Math.round(targetKg));
    if (t <= 0) {
      set({ weightCart: {}, weightTargetKg: targetKg });
      return;
    }
    const needed = t % 2 === 0 ? t : t + 1;
    const numQuick2 = Math.floor(needed / 4);
    const remainder = needed % 4;
    const numQuick1 = remainder === 2 ? 1 : 0;

    const weightCart: Record<string, number> = {};
    if (numQuick1 > 0) weightCart[WEIGHT_QUICK1_SKU] = numQuick1;
    if (numQuick2 > 0) weightCart[WEIGHT_QUICK2_SKU] = numQuick2;
    set({ weightCart, weightTargetKg: targetKg });
  },

  incAddonQty(optionId) {
    set((s) => ({ addonCart: { ...s.addonCart, [optionId]: (s.addonCart[optionId] ?? 0) + 1 } }));
  },

  decAddonQty(optionId) {
    set((s) => {
      const next = Math.max(0, (s.addonCart[optionId] ?? 0) - 1);
      const addonCart = { ...s.addonCart };
      if (next <= 0) delete addonCart[optionId];
      else addonCart[optionId] = next;
      return { addonCart };
    });
  },

  setView(index) {
    set({ viewIndex: ((index % VIEW_COUNT) + VIEW_COUNT) % VIEW_COUNT });
  },

  rotateView(delta) {
    get().setView(get().viewIndex + delta);
  },

  // "前往結帳" opens the upsell modal first rather than navigating straight
  // to checkout - see AddonUpsellModal. Both exits from that modal end up
  // calling the same navigation as the old direct goToCheckout() did.
  openAddonUpsell() {
    set({ showAddonModal: true });
  },

  skipAddonsAndCheckout() {
    set({ showAddonModal: false, addonCart: {}, view: 'checkout' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  confirmAddonsAndCheckout() {
    set({ showAddonModal: false, view: 'checkout' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goToCheckout() {
    set({ view: 'checkout' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goToConfigurator() {
    set({ view: 'configurator', lastOrder: null, lastContact: null });
  },

  goToConfirmation(order, contact) {
    set({ view: 'confirmation', lastOrder: order, lastContact: contact ?? null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
}));
