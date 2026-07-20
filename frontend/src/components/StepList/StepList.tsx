import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import StepAccordionItem from './StepAccordionItem';

// Ported from stepsEl.innerHTML = STEPS.map(...) (~line 899).
// 'addon' is deliberately excluded - it's a real catalog step (for proper
// SKU/pricing) but only ever surfaced via AddonUpsellModal right before
// checkout, not as a configurator category here.
export default function StepList() {
  const steps = useConfiguratorStore((s) => s.steps);
  const openStep = useConfiguratorStore((s) => s.openStep);

  return (
    <div className="flex flex-col gap-3.5">
      {steps
        .filter((step) => step.id !== 'addon')
        .map((step) => (
          <StepAccordionItem key={step.id} step={step} isOpen={openStep === step.id} />
        ))}
    </div>
  );
}
