import { useState } from 'react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { addonCartEntries, getAddonStep } from '../../store/selectors';
import { fmt } from '../../lib/pricing';
import { colorFor, swatchStyle } from '../../lib/color';
import { Step, StepOption } from '../../types';

// "在訂單結算之前再跳出可以加價購的項目" - shown when "前往結帳" is clicked,
// before actually navigating to the checkout view (see openAddonUpsell() /
// CheckoutBar). Deliberately low-pressure: the "不需要，繼續結帳" exit is the
// visually prominent action, not the upsell items themselves.
//
// Addon options can be flat (DSMB - one SKU, no variants) or grouped (30m
// 鋁合金線軸/30m塑膠線軸/散光超亮手電筒 - a variant choice, either color
// swatches or text cards depending on isColorVariantGroup() below).
//
// specNote (backend) only ever persists per option-group (see seed.ts /
// products.service.ts), so it has no way to hold a caption for a flat,
// single-variant option like DSMB - this is that caption instead, keyed by
// option id, entirely client-side since it's just one fixed line of text.
const FLAT_OPTION_NOTES: Record<string, string> = {
  'addon-dsmb': '因安全因素，本店只售1.8m長*18cm寬螢光橘',
};

// A group's variants are only worth picking via color swatches if they're
// actually different colors - e.g. 散光超亮手電筒's "含電池*4"/"不含電池*4"
// aren't colors at all, and colorFor() would resolve both to the same
// fallback grey, making two identical-looking circles. If every option in
// the group maps to a distinct color, treat it as a real color picker;
// otherwise fall back to labeled text cards.
function isColorVariantGroup(options: StepOption[]): boolean {
  const colors = new Set(options.map((o) => colorFor(o.name)));
  return colors.size === options.length;
}

type AddonRow = { kind: 'flat'; option: StepOption } | { kind: 'group'; groupId: string };

// Walks addonStep.options in seed order, emitting one row per flat option
// and one row per group (at the position of that group's FIRST option) -
// this is what makes the on-screen order "1.DSMB 2.鋁合金線軸 3.塑膠線軸
// 4.手電筒" follow the catalog's own option order, rather than the old
// "all groups, then all flats" split which couldn't interleave a flat item
// (DSMB) before a grouped one.
function buildAddonRows(step: Step): AddonRow[] {
  const rows: AddonRow[] = [];
  const seenGroups = new Set<string>();
  for (const option of step.options) {
    if (option.group) {
      if (!seenGroups.has(option.group)) {
        seenGroups.add(option.group);
        rows.push({ kind: 'group', groupId: option.group });
      }
    } else {
      rows.push({ kind: 'flat', option });
    }
  }
  return rows;
}

export default function AddonUpsellModal() {
  const steps = useConfiguratorStore((s) => s.steps);
  const addonCart = useConfiguratorStore((s) => s.addonCart);
  const incAddonQty = useConfiguratorStore((s) => s.incAddonQty);
  const decAddonQty = useConfiguratorStore((s) => s.decAddonQty);
  const skipAddonsAndCheckout = useConfiguratorStore((s) => s.skipAddonsAndCheckout);
  const confirmAddonsAndCheckout = useConfiguratorStore((s) => s.confirmAddonsAndCheckout);

  const addonStep = getAddonStep(steps);
  const entries = addonCartEntries(steps, addonCart);
  const selectedCount = entries.reduce((sum, { qty }) => sum + qty, 0);
  const subtotalTwd = entries.reduce((sum, { option, qty }) => sum + option.priceTwd * qty, 0);

  // Which color SKU is "active" (the one the qty stepper controls) per
  // grouped product - defaults to that group's def option, or its first.
  const [activeByGroup, setActiveByGroup] = useState<Record<string, string>>({});

  if (!addonStep) return null;
  const rows = buildAddonRows(addonStep);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-md bg-white p-5">
        <h2 className="font-display text-lg uppercase tracking-wide text-ink">加購優惠</h2>
        <p className="mt-1 text-[13px] text-ink-dim">結帳前，要不要順便加購幾樣推薦配件？（選填）</p>

        <div className="mt-4 flex flex-col gap-2.5">
          {rows.map((row) =>
            row.kind === 'flat' ? (
              <FlatAddonRow
                key={row.option.id}
                option={row.option}
                qty={addonCart[row.option.id] ?? 0}
                note={FLAT_OPTION_NOTES[row.option.id]}
                onInc={() => incAddonQty(row.option.id)}
                onDec={() => decAddonQty(row.option.id)}
              />
            ) : (
              <GroupAddonRow
                key={row.groupId}
                step={addonStep}
                groupId={row.groupId}
                addonCart={addonCart}
                activeId={activeByGroup[row.groupId]}
                onSelect={(optionId) => setActiveByGroup((s) => ({ ...s, [row.groupId]: optionId }))}
                onInc={incAddonQty}
                onDec={decAddonQty}
              />
            ),
          )}
        </div>

        {selectedCount > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[13px]">
            <span className="text-ink-dim">加購小計（共 {selectedCount} 項）</span>
            <span className="font-mono font-semibold text-signal">NT${fmt(subtotalTwd)}</span>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={confirmAddonsAndCheckout}
              className="w-full rounded-sm border border-signal bg-signal py-3.5 text-[14px] font-semibold text-[#1a0e08] hover:bg-[#ff7d54]"
            >
              加入所選項目，繼續結帳
            </button>
          )}
          <button
            type="button"
            onClick={skipAddonsAndCheckout}
            className={
              selectedCount > 0
                ? 'w-full rounded-sm border border-line py-2.5 text-[13px] text-ink-dim hover:border-teal hover:text-ink'
                : 'w-full rounded-sm border border-signal bg-signal py-3.5 text-[14px] font-semibold text-[#1a0e08] hover:bg-[#ff7d54]'
            }
          >
            不需要加價購，繼續結帳
          </button>
        </div>
      </div>
    </div>
  );
}

interface QtyStepperProps {
  qty: number;
  onInc: () => void;
  onDec: () => void;
}

function QtyStepper({ qty, onInc, onDec }: QtyStepperProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onDec}
        disabled={qty === 0}
        className="flex h-7 w-7 items-center justify-center rounded border border-line bg-white text-sm leading-none hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-[16px] text-center font-mono text-[14px]">{qty}</span>
      <button
        type="button"
        onClick={onInc}
        className="flex h-7 w-7 items-center justify-center rounded border border-line bg-white text-sm leading-none hover:border-teal hover:text-teal"
      >
        ＋
      </button>
    </div>
  );
}

interface FlatAddonRowProps {
  option: StepOption;
  qty: number;
  note?: string;
  onInc: () => void;
  onDec: () => void;
}

function FlatAddonRow({ option, qty, note, onInc, onDec }: FlatAddonRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-sm border px-3.5 py-3 ${
        qty > 0 ? 'border-signal bg-gradient-to-b from-signal-dim/40 to-signal-dim/5' : 'border-line bg-panel-raised'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {option.img && (
          // h-16 w-10 (not a square tile) - DSMB's photo is an unusually
          // tall/narrow 179x549 product shot; a square box would leave it
          // looking like a lost sliver, this shape actually suits it (and
          // still works fine for a more normally-proportioned photo later).
          <div className="flex h-16 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-line bg-white">
            <img src={option.img} alt={option.name} className="max-h-full max-w-full object-contain" />
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-medium text-ink">{option.name}</div>
          {note && <div className="mt-0.5 text-[11px] text-ink-dim">{note}</div>}
          <div className={`mt-0.5 font-mono text-[12px] ${qty > 0 ? 'text-signal' : 'text-teal'}`}>
            NT${fmt(option.priceTwd)}
          </div>
        </div>
      </div>
      <QtyStepper qty={qty} onInc={onInc} onDec={onDec} />
    </div>
  );
}

interface GroupAddonRowProps {
  step: Step;
  groupId: string;
  addonCart: Record<string, number>;
  activeId: string | undefined;
  onSelect: (optionId: string) => void;
  onInc: (optionId: string) => void;
  onDec: (optionId: string) => void;
}

function GroupAddonRow({ step, groupId, addonCart, activeId, onSelect, onInc, onDec }: GroupAddonRowProps) {
  const groupOptions = step.options.filter((o) => o.group === groupId);
  const groupLabel = step.groups?.find((g) => g.id === groupId)?.label ?? groupId;
  const resolvedActiveId = activeId ?? groupOptions.find((o) => o.def)?.id ?? groupOptions[0]?.id;
  const active = groupOptions.find((o) => o.id === resolvedActiveId) ?? groupOptions[0];
  const qty = addonCart[active.id] ?? 0;
  const note = step.specNote?.[groupId];
  const isColorGroup = isColorVariantGroup(groupOptions);
  // Color groups: the header photo tracks whichever swatch is selected
  // (that's the point - a color preview). Non-color groups (e.g. 含電池/
  // 不含電池): same physical product either way, so the header shows one
  // fixed representative photo instead of switching per variant, and the
  // individual cards below never show a photo at all (see the non-color
  // branch further down).
  const headerImg = isColorGroup ? active.img : (groupOptions.find((o) => o.def) ?? groupOptions[0])?.img;

  return (
    <div
      className={`rounded-sm border px-3.5 py-3 ${
        qty > 0 ? 'border-signal bg-gradient-to-b from-signal-dim/40 to-signal-dim/5' : 'border-line bg-panel-raised'
      }`}
    >
      <div className="flex items-center gap-3">
        {headerImg && (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-line bg-white">
            <img src={headerImg} alt={active.name} className="max-h-full max-w-full object-contain" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-medium text-ink">
            {groupLabel}－{active.name}
          </div>
          {note && <div className="mt-0.5 text-[11px] text-ink-dim">{note}</div>}
          <div className={`mt-0.5 font-mono text-[12px] ${qty > 0 ? 'text-signal' : 'text-teal'}`}>
            NT${fmt(active.priceTwd)}
          </div>
        </div>
        <QtyStepper qty={qty} onInc={() => onInc(active.id)} onDec={() => onDec(active.id)} />
      </div>

      {isColorGroup ? (
        <div className="mt-3 flex flex-wrap gap-2.5">
          {groupOptions.map((opt) => {
            const isSelected = opt.id === active.id;
            const optQty = addonCart[opt.id] ?? 0;
            return (
              <button
                key={opt.id}
                type="button"
                title={opt.name}
                onClick={() => onSelect(opt.id)}
                className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected ? 'border-ink' : 'border-transparent hover:border-teal-dim'
                }`}
              >
                <span className="block h-6 w-6 rounded-full border border-black/10" style={swatchStyle(opt.name)} />
                {optQty > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-signal text-[9px] font-bold text-white">
                    {optQty}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-1.5">
          {groupOptions.map((opt) => {
            const isSelected = opt.id === active.id;
            const optQty = addonCart[opt.id] ?? 0;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelect(opt.id)}
                className={`flex items-center gap-2.5 rounded-sm border px-2.5 py-2 text-left transition-colors ${
                  isSelected ? 'border-ink bg-white' : 'border-line bg-white/60 hover:border-teal-dim'
                }`}
              >
                {/* No photo here on purpose, even if opt.img is set - the
                    header above already shows one fixed representative
                    photo for the whole (non-color) group; these cards are
                    text-only. */}
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{opt.name}</span>
                <span className="flex-shrink-0 font-mono text-[11px] text-ink-dim">NT${fmt(opt.priceTwd)}</span>
                {optQty > 0 && (
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-signal text-[9px] font-bold text-white">
                    {optQty}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
