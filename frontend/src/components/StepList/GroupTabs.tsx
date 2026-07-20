import { StepGroup } from '../../types';
import { buildGroupTabs } from '../../store/selectors';

interface GroupTabsProps {
  groups: StepGroup[];
  activeGroup: string | undefined;
  onSelect: (groupId: string) => void;
}

// Ported from the group-tabs markup (~line 964-966, 972-974). Groups that
// carry a tagline (buyer-guidance label, e.g. "輕便優先") render as a
// two-line button instead of the plain single-line pill. Groups sharing a
// parentLabel (e.g. STA's 3 aluminum specs) collapse into one tab via
// buildGroupTabs() - clicking it selects the first member group, and
// StepAccordionItem shows every sibling's options together underneath.
export default function GroupTabs({ groups, activeGroup, onSelect }: GroupTabsProps) {
  const tabs = buildGroupTabs(groups);

  return (
    <div className="mb-3.5 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.memberIds.includes(activeGroup ?? '');
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            className={`rounded-2xl border px-3.5 py-2 text-center transition-colors ${
              isActive
                ? 'border-signal bg-signal-dim/30 text-signal'
                : 'border-line text-ink-dim hover:border-teal-dim hover:text-ink'
            }`}
          >
            <span className="block font-mono text-[11.5px] tracking-wide">{tab.label}</span>
            {tab.tagline && (
              <span className={`mt-0.5 block text-[10px] ${isActive ? 'text-signal/80' : 'text-ink-dim/80'}`}>
                {tab.tagline}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
