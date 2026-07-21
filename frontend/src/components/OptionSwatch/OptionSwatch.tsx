import { useState } from 'react';
import { StepOption } from '../../types';
import { swatchStyle } from '../../lib/color';
import { fmt } from '../../lib/pricing';

interface OptionSwatchProps {
  option: StepOption;
  selected: boolean;
  onSelect: () => void;
  // When true, the photo-tile mode fills its container (w-full) instead of
  // a fixed 150px - used inside a CSS grid (e.g. BACKPLATE's 3-per-row
  // 鋁板 grid) where the column width, not the card, should drive sizing.
  fullWidth?: boolean;
}

// Ported from swatchGrid() (~line 928-943), extended with a third mode:
// - option.img: full product photo, shown whole (never cropped) inside a
//   fixed-size box - every photo tile is identically sized regardless of
//   the source photo's own aspect ratio (tank band hardware, wing splice
//   colors, leopard/floral)
// - option.swatchImg: cropped fabric/pattern texture, rendered as a small
//   chip in the same slot as the plain color circle
// - neither: CSS color/pattern chip (swatchStyle)
export default function OptionSwatch({ option, selected, onSelect, fullWidth }: OptionSwatchProps) {
  // If a photo 404s, fall back to the next mode down instead of showing the
  // browser's broken-image icon + alt text.
  const [imageFailed, setImageFailed] = useState(false);
  const [swatchImageFailed, setSwatchImageFailed] = useState(false);
  const showPhoto = Boolean(option.img) && !imageFailed;
  const showSwatchPhoto = !showPhoto && Boolean(option.swatchImg) && !swatchImageFailed;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      className={`relative flex cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2.5 pl-2.5 transition-all duration-200 ${
        showPhoto
          ? `${fullWidth ? 'w-full' : 'w-[150px]'} flex-col items-stretch gap-0 rounded-md p-2.5 hover:-translate-y-0.5 hover:shadow-md`
          : ''
      } ${
        selected
          ? 'border-signal bg-gradient-to-b from-signal-dim/40 to-signal-dim/5 shadow-sm'
          : 'border-line bg-panel-raised hover:border-teal-dim'
      }`}
    >
      {option.badge && (
        <span className="absolute -right-1.5 -top-1.5 z-10 whitespace-nowrap rounded-full bg-signal px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#1a0e08]">
          {option.badge}
        </span>
      )}

      {showPhoto ? (
        <div className="mb-2.5 flex h-[120px] w-full items-center justify-center overflow-hidden rounded-[4px] border border-line bg-white p-1.5">
          <img
            src={option.img}
            alt={option.name}
            onError={() => setImageFailed(true)}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : showSwatchPhoto ? (
        <img
          src={option.swatchImg}
          alt=""
          onError={() => setSwatchImageFailed(true)}
          className="h-5 w-5 flex-shrink-0 rounded-[5px] border border-black/10 object-cover"
        />
      ) : (
        <span
          className="h-5 w-5 flex-shrink-0 rounded-[5px] border border-black/10 bg-cover bg-center"
          style={swatchStyle(option.name)}
        />
      )}

      <span className={`flex flex-col ${showPhoto ? 'items-center text-center' : ''}`}>
        <span className={`text-[12.5px] font-medium ${showPhoto ? 'whitespace-normal leading-tight' : 'whitespace-nowrap'}`}>
          {option.name}
        </span>
        <span className={`mt-0.5 font-mono text-[11px] ${selected ? 'text-signal' : 'text-teal'}`}>
          NT${fmt(option.priceTwd)}
        </span>
      </span>
    </div>
  );
}
