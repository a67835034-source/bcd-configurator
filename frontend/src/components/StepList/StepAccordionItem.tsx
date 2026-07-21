import { useRef, useState } from 'react';
import { Step, StepOption } from '../../types';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { getSiblingGroupIds, weightCartEntries, weightDisplayName } from '../../store/selectors';
import { COLOR_CATEGORY_LABELS, COLOR_CATEGORY_ORDER, getColorCategory } from '../../lib/color';
import { fmt } from '../../lib/pricing';
import GroupTabs from './GroupTabs';
import OptionSwatch from '../OptionSwatch/OptionSwatch';
import WeightOptionSwatch from '../OptionSwatch/WeightOptionSwatch';
import WeightCartSummary from './WeightCartSummary';

interface StepAccordionItemProps {
  step: Step;
  isOpen: boolean;
}

// Ported from the per-step render() branch (~line 899-998): one accordion
// row, with three body layouts (tank / weight / generic single-select).
export default function StepAccordionItem({ step, isOpen }: StepAccordionItemProps) {
  const selections = useConfiguratorStore((s) => s.selections);
  const groupSelections = useConfiguratorStore((s) => s.groupSelections);
  const weightCart = useConfiguratorStore((s) => s.weightCart);
  const tankB = useConfiguratorStore((s) => s.tankB);
  const tankLinked = useConfiguratorStore((s) => s.tankLinked);
  const steps = useConfiguratorStore((s) => s.steps);

  const openStepId = useConfiguratorStore((s) => s.openStepId);
  const selectGroup = useConfiguratorStore((s) => s.selectGroup);
  const selectOption = useConfiguratorStore((s) => s.selectOption);
  const setTankLinked = useConfiguratorStore((s) => s.setTankLinked);
  const incWeightQty = useConfiguratorStore((s) => s.incWeightQty);
  const decWeightQty = useConfiguratorStore((s) => s.decWeightQty);
  const autoFillWeight = useConfiguratorStore((s) => s.autoFillWeight);

  const isTank = step.id === 'tank';
  const isWeight = step.id === 'weight';
  const optA = step.options.find((o) => o.id === selections[step.id]);
  const optB = isTank ? step.options.find((o) => o.id === tankB) : undefined;
  const activeGroup = step.groups ? groupSelections[step.id] : undefined;
  const activeGroupObj = step.groups?.find((g) => g.id === activeGroup);
  // Normally just [activeGroup]; when activeGroup shares a parentLabel with
  // siblings (e.g. STA's 3 aluminum specs under "鋁板"), every sibling's
  // options should render together, not just the one that happens to be
  // "active" - see buildGroupTabs()/GroupTabs for the matching tab merge.
  const siblingGroupIds = step.groups ? getSiblingGroupIds(step.groups, activeGroup) : [];
  const visibleOptions = step.groups
    ? step.options.filter((o) => o.group !== undefined && siblingGroupIds.includes(o.group))
    : step.options;
  const specNoteText = step.groups && activeGroup ? step.specNote?.[activeGroup] : undefined;
  const isMergedGroup = siblingGroupIds.length > 1;

  let selectedSummary: string;
  let selectedPrice: string;
  if (isWeight) {
    const entries = weightCartEntries(steps, weightCart);
    if (entries.length === 0) {
      selectedSummary = '尚未選擇';
      selectedPrice = 'NT$0';
    } else {
      selectedSummary = entries.map(({ option, qty }) => `${weightDisplayName(option)}×${qty}`).join('＋');
      const totalTwd = entries.reduce((sum, { option, qty }) => sum + option.priceTwd * qty, 0);
      selectedPrice = `NT$${fmt(totalTwd)}`;
    }
  } else if (isTank && optA && optB) {
    selectedSummary = optA.id === optB.id ? `${optA.name} ×2` : `${optA.name} + ${optB.name}`;
    selectedPrice = `NT$${fmt(optA.priceTwd + optB.priceTwd)}`;
  } else {
    selectedSummary = optA?.name ?? '尚未選擇';
    selectedPrice = optA ? `NT$${fmt(optA.priceTwd)}` : 'NT$0';
  }

  return (
    <div className={`overflow-hidden rounded-sm border bg-panel ${isOpen ? 'border-signal/40' : 'border-line'}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => openStepId(step.id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openStepId(step.id)}
        className="flex cursor-pointer select-none items-center gap-4 px-[22px] py-[18px]"
      >
        <div
          className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border font-mono text-xs ${
            isOpen ? 'border-signal text-signal' : 'border-teal-dim text-teal'
          }`}
        >
          {step.num}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <div className="font-display text-[17px] uppercase tracking-wide">{step.title}</div>
            {step.note && (
              <span className="whitespace-nowrap rounded-full bg-teal/10 px-2 py-0.5 text-[10.5px] text-teal">{step.note}</span>
            )}
          </div>
          {step.sub && <div className="mt-0.5 text-[12.5px] text-ink-dim">{step.sub}</div>}
        </div>
        <div className="whitespace-nowrap text-right font-mono text-xs text-teal">
          {selectedSummary}
          <span className="mt-0.5 block text-[11px] text-ink-dim">{selectedPrice}</span>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`h-4 w-4 flex-shrink-0 text-ink-dim transition-transform ${isOpen ? 'rotate-180 text-signal' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <div className={`step-body ${isOpen ? 'open border-t border-line' : ''}`}>
        <div className="px-[22px] pb-[22px] pt-[18px]">
          {step.desc && <p className="mb-3.5 max-w-[560px] text-[13px] text-ink-dim">{step.desc}</p>}

          {isTank && optA && optB ? (
            <>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-teal">第一條</div>
              <div className="flex flex-wrap gap-2">
                {step.options.map((o) => (
                  <OptionSwatch key={o.id} option={o} selected={o.id === selections[step.id]} onSelect={() => selectOption(step.id, o.id, 'a')} />
                ))}
              </div>
              <label className="mt-3.5 flex cursor-pointer select-none items-center gap-2 text-[13px] text-ink-dim">
                <input
                  type="checkbox"
                  checked={tankLinked}
                  onChange={(e) => setTankLinked(e.target.checked)}
                  className="h-[15px] w-[15px] accent-signal"
                />
                第二條使用相同款式
              </label>
              {!tankLinked && (
                <>
                  <div className="mb-2 mt-3.5 font-mono text-[11px] uppercase tracking-wide text-teal">第二條</div>
                  <div className="flex flex-wrap gap-2">
                    {step.options.map((o) => (
                      <OptionSwatch key={o.id} option={o} selected={o.id === tankB} onSelect={() => selectOption(step.id, o.id, 'b')} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : isWeight && step.groups ? (
            <>
              <WeightTargetRow onAutoFill={autoFillWeight} />
              <GroupTabs groups={step.groups} activeGroup={activeGroup} onSelect={(g) => selectGroup(step.id, g)} />
              {specNoteText && (
                <div className="mb-3.5 border-l-2 border-teal-dim bg-teal/5 px-3 py-2.5 text-xs leading-relaxed text-ink-dim">
                  {specNoteText}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {visibleOptions.map((o) => (
                  <WeightOptionSwatch
                    key={o.id}
                    option={o}
                    qty={weightCart[o.id] ?? 0}
                    onInc={() => incWeightQty(o.id)}
                    onDec={() => decWeightQty(o.id)}
                  />
                ))}
              </div>
              <WeightCartSummary />
            </>
          ) : (
            <div className={step.referenceImage ? 'flex flex-col gap-5 md:flex-row md:items-start' : undefined}>
              {/* flex-1 + min-w-0: the grid claims all space the fixed-width
                  reference image doesn't use, so a 3-column layout (e.g.
                  鋁板) always has room, instead of being squeezed to a fixed
                  fraction - shrinking the image is the lever, not the grid. */}
              <div className={step.referenceImage ? 'md:min-w-0 md:flex-1' : undefined}>
                {step.groups && <GroupTabs groups={step.groups} activeGroup={activeGroup} onSelect={(g) => selectGroup(step.id, g)} />}
                {isMergedGroup ? (
                  <GroupedSwatchSections
                    step={step}
                    siblingGroupIds={siblingGroupIds}
                    selectedId={selections[step.id]}
                    onSelect={(optionId) => selectOption(step.id, optionId)}
                    threeColumns={Boolean(step.referenceImage)}
                  />
                ) : (
                  <>
                    {activeGroupObj?.recommendation && (
                      <div className="mb-3.5 rounded-sm border border-signal-dim bg-signal-dim/10 px-3 py-2.5 text-xs leading-relaxed text-ink">
                        {activeGroupObj.recommendation}
                      </div>
                    )}
                    {specNoteText && (
                      <div className="mb-3.5 border-l-2 border-teal-dim bg-teal/5 px-3 py-2.5 text-xs leading-relaxed text-ink-dim">
                        {specNoteText}
                      </div>
                    )}
                    <CategorizedSwatchGrid
                      options={visibleOptions}
                      selectedId={selections[step.id]}
                      onSelect={(optionId) => selectOption(step.id, optionId)}
                      threeColumns={Boolean(step.referenceImage)}
                    />
                  </>
                )}
              </div>
              {step.referenceImage && (
                <StepReferenceImage
                  src={step.referenceImage}
                  caption={step.referenceImageCaption}
                  narrow={step.id === 'sta'}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GroupedSwatchSectionsProps {
  step: Step;
  siblingGroupIds: string[];
  selectedId: string | undefined;
  onSelect: (optionId: string) => void;
  threeColumns?: boolean;
}

// Renders every sibling group under a merged tab (e.g. STA's "鋁板" tab ->
// 3mm輕量化鋁板 / 3mm鋁板 / 2mm鋁板) as its own labeled sub-section, each
// with its own spec note and swatch grid, stacked together on one screen -
// this is the "same screen" requirement buildGroupTabs()'s merge is for.
function GroupedSwatchSections({ step, siblingGroupIds, selectedId, onSelect, threeColumns }: GroupedSwatchSectionsProps) {
  return (
    <>
      {siblingGroupIds.map((groupId) => {
        const group = step.groups?.find((g) => g.id === groupId);
        const groupOptions = step.options.filter((o) => o.group === groupId);
        const noteText = step.specNote?.[groupId];
        if (!group || groupOptions.length === 0) return null;
        return (
          <div key={groupId} className="mb-5 last:mb-0">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-signal">{group.label}</div>
            {noteText && (
              <div className="mb-3 border-l-2 border-teal-dim bg-teal/5 px-3 py-2.5 text-xs leading-relaxed text-ink-dim">
                {noteText}
              </div>
            )}
            <CategorizedSwatchGrid options={groupOptions} selectedId={selectedId} onSelect={onSelect} threeColumns={threeColumns} />
          </div>
        );
      })}
    </>
  );
}

interface CategorizedSwatchGridProps {
  options: StepOption[];
  selectedId: string | undefined;
  onSelect: (optionId: string) => void;
  // Fixed 3-per-row grid instead of flex-wrap, so wide photo tiles (e.g.
  // BACKPLATE's 鋁板 with 8 options) line up in clean rows regardless of
  // how much width the neighboring reference-image column leaves behind.
  threeColumns?: boolean;
}

// Splits a step's color options into labeled sections in COLOR_CATEGORY_ORDER
// (單色系 / 螢光色系 / 迷彩 / 混色系), e.g. WING 25LBS. Section labels are
// only shown when more than one category is actually present, so simpler
// steps (backplate, sta - all "solid") render as a single plain grid.
function CategorizedSwatchGrid({ options, selectedId, onSelect, threeColumns }: CategorizedSwatchGridProps) {
  const byCategory = new Map<string, StepOption[]>();
  for (const option of options) {
    const category = getColorCategory(option.name);
    byCategory.set(category, [...(byCategory.get(category) ?? []), option]);
  }
  const presentCategories = COLOR_CATEGORY_ORDER.filter((c) => byCategory.has(c));
  const showLabels = presentCategories.length > 1;

  return (
    <>
      {presentCategories.map((category) => (
        <div key={category} className="mb-4 last:mb-0">
          {showLabels && (
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-teal">
              {COLOR_CATEGORY_LABELS[category]}
            </div>
          )}
          <div className={threeColumns ? 'grid grid-cols-2 gap-2 sm:grid-cols-3' : 'flex flex-wrap gap-2'}>
            {(byCategory.get(category) ?? []).map((o) => (
              <OptionSwatch
                key={o.id}
                option={o}
                selected={o.id === selectedId}
                onSelect={() => onSelect(o.id)}
                fullWidth={threeColumns}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// Illustrative photo alongside a step's option grid (e.g. the harness strap
// included with every backplate). Hides itself on load failure rather than
// showing a broken-image icon, same fallback pattern as OptionSwatch.
function StepReferenceImage({ src, caption, narrow }: { src: string; caption?: string; narrow?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // Fixed width + flex-shrink-0 (not a fraction like w-1/3): the image
    // stays a small, constant size so the grid next to it always keeps
    // its space, no matter how wide or narrow the accordion body is.
    // md:mt-14 (not items-center) also keeps it anchored at the same spot
    // regardless of the left column's height, which swings a lot between
    // groups with very different option counts (e.g. 鋁板's 8 vs 鈦合金's 1).
    <div className={`reference-image-enter md:flex-shrink-0 ${narrow ? 'md:mt-0 md:w-[120px]' : 'md:mt-14 md:w-[190px]'}`}>
      <div className="reference-image-glow group relative overflow-hidden rounded-lg border-2 border-teal-dim/50 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-teal hover:shadow-lg">
        <img
          src={src}
          alt={caption ?? ''}
          onError={() => setFailed(true)}
          className="w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-signal px-3 py-1 text-[13px] font-bold text-white shadow-md">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
            <path d="M5 13l4 4L19 7" />
          </svg>
          免費附贈
        </span>
      </div>
      {caption && <div className="mt-2 text-center text-xs text-ink-dim">{caption}</div>}
    </div>
  );
}

function WeightTargetRow({ onAutoFill }: { onAutoFill: (kg: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-sm border border-teal-dim bg-teal/5 p-3">
      <label htmlFor="weightTargetInput" className="whitespace-nowrap text-[12.5px] text-ink-dim">
        目標配重（雙邊合計，kg）
      </label>
      <input
        id="weightTargetInput"
        ref={inputRef}
        type="number"
        min={0}
        step={1}
        placeholder="例如 6"
        className="w-[90px] rounded-sm border border-line bg-panel px-2.5 py-[7px] font-mono text-[13px] text-ink focus:border-teal focus:outline-none"
      />
      <button
        type="button"
        className="rounded-sm border border-signal bg-signal px-3.5 py-2 text-[12.5px] font-semibold text-[#1a0e08] hover:bg-[#ff7d54]"
        onClick={() => {
          const val = parseFloat(inputRef.current?.value ?? '');
          if (!Number.isNaN(val) && val > 0) onAutoFill(val);
        }}
      >
        自動帶入
      </button>
    </div>
  );
}
