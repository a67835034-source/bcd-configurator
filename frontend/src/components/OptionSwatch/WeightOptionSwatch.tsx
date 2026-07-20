import { useState } from 'react';
import { StepOption } from '../../types';
import { swatchStyle } from '../../lib/color';
import { fmt } from '../../lib/pricing';
import { usePriceTwd } from '../../hooks/usePriceTwd';
import { weightDisplayName } from '../../store/selectors';

interface WeightOptionSwatchProps {
  option: StepOption;
  qty: number;
  onInc: () => void;
  onDec: () => void;
}

// Ported from weightSwatchGrid() (~line 849-869): same tile as OptionSwatch
// but with a +/- quantity stepper instead of click-to-select, since the
// weight pockets step is a cart (multiple SKUs at once) not a single pick.
export default function WeightOptionSwatch({ option, qty, onInc, onDec }: WeightOptionSwatchProps) {
  const priceTwd = usePriceTwd();
  // Same photo-with-CSS-fallback pattern as OptionSwatch, just in a smaller
  // box to fit this row layout instead of OptionSwatch's stacked tile.
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(option.img) && !imageFailed;

  return (
    <div
      className={`relative flex cursor-default items-center gap-2.5 rounded-sm border py-2.5 pl-2.5 pr-2.5 ${
        qty > 0 ? 'border-signal bg-gradient-to-b from-signal-dim/40 to-signal-dim/5' : 'border-line bg-panel-raised'
      }`}
    >
      {option.badge && (
        <span className="absolute -right-1.5 -top-1.5 whitespace-nowrap rounded-full bg-signal px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#1a0e08]">
          {option.badge}
        </span>
      )}
      {showPhoto ? (
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-line bg-white p-0.5">
          <img
            src={option.img}
            alt={option.name}
            onError={() => setImageFailed(true)}
            className="max-h-full max-w-full object-contain"
          />
        </span>
      ) : (
        <span className="h-5 w-5 flex-shrink-0 rounded-[5px] border border-black/10 bg-cover bg-center" style={swatchStyle(option.name)} />
      )}
      <span className="flex flex-col">
        <span className="whitespace-nowrap text-[12.5px] font-medium">{weightDisplayName(option)}</span>
        <span className={`mt-0.5 font-mono text-[11px] ${qty > 0 ? 'text-signal' : 'text-teal'}`}>
          NT${fmt(priceTwd(option.priceRMB))}
        </span>
      </span>
      <span className="ml-auto flex flex-shrink-0 items-center gap-1.5 pl-2">
        <button
          type="button"
          onClick={onDec}
          className="flex h-[22px] w-[22px] items-center justify-center rounded border border-line bg-panel text-sm leading-none hover:border-teal hover:text-teal"
        >
          −
        </button>
        <span className="min-w-[14px] text-center font-mono text-[13px]">{qty}</span>
        <button
          type="button"
          onClick={onInc}
          className="flex h-[22px] w-[22px] items-center justify-center rounded border border-line bg-panel text-sm leading-none hover:border-teal hover:text-teal"
        >
          ＋
        </button>
      </span>
    </div>
  );
}
