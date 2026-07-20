import { useRef, useState } from 'react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { getPartFillName } from '../../store/selectors';
import { fillForPart, gradientStopsFor, paletteFor, PatternDef } from '../../lib/color';
import { VIEWS } from './schematicPaths';
import { DRAG_STEP_PX, VIEW_NAMES } from '../../lib/schematicConstants';

// All part ids that ever appear in the schematic, used to pre-declare
// gradient defs the same way the legacy <svg><defs> block did (~line 422-431).
const ALL_PARTS = ['wing', 'backplate', 'sta', 'weight', 'tank-a', 'tank-b'];

// Fixed display box for the illustration, independent of both the photo's
// intrinsic size (may 404) and the SVG viewBox's own proportions (e.g.
// "0 0 220 560" is a very tall/narrow *coordinate space* for tracing the
// wing shape - locking the container to that ratio blows it up to ~700px
// tall). preserveAspectRatio="xMidYMid meet" scales the art to fit inside
// this box without distortion, same idea as object-contain on the photo.
const ILLUSTRATION_BOX_HEIGHT = 340;

export default function SchematicViewer() {
  const steps = useConfiguratorStore((s) => s.steps);
  const selections = useConfiguratorStore((s) => s.selections);
  const weightCart = useConfiguratorStore((s) => s.weightCart);
  const tankB = useConfiguratorStore((s) => s.tankB);
  const openStep = useConfiguratorStore((s) => s.openStep);
  const viewIndex = useConfiguratorStore((s) => s.viewIndex);
  const rotateView = useConfiguratorStore((s) => s.rotateView);

  const viewerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef({ startX: 0, accumulated: 0 });
  // Product photos aren't wired up yet (see schematicPaths.ts) - track which
  // ones 404 so the layout can fall back to a fixed-aspect placeholder
  // instead of collapsing to the broken-image icon's tiny intrinsic size.
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  if (steps.length === 0) return null;

  const activePart = steps.find((s) => s.id === openStep)?.part;

  // Resolve fill (solid color / gradient / pattern reference) + gradient
  // stops for every part up front, ported from updateSchematic()
  // (~line 596-625). Leopard/floral resolve to a shared <pattern> (by name,
  // not per-part) since the tile is identical wherever it's used.
  const fillByPart = new Map<string, { fill: string; stops: ReturnType<typeof gradientStopsFor> | null }>();
  const patternDefs = new Map<string, PatternDef>();
  for (const part of ALL_PARTS) {
    const name = getPartFillName(part, steps, selections, weightCart, tankB);
    if (name === null) {
      fillByPart.set(part, { fill: 'none', stops: null });
      continue;
    }
    const resolved = fillForPart(part, name);
    if (resolved.type === 'pattern') {
      patternDefs.set(resolved.pattern.id, resolved.pattern);
      fillByPart.set(part, { fill: `url(#${resolved.pattern.id})`, stops: null });
    } else if (resolved.type === 'gradient') {
      const palette = paletteFor(name) ?? [];
      fillByPart.set(part, { fill: `url(#${resolved.gradientId})`, stops: gradientStopsFor(palette) });
    } else {
      fillByPart.set(part, { fill: resolved.color, stops: null });
    }
  }

  function isPartActive(part: string): boolean {
    if (!activePart) return false;
    return part === activePart || part.indexOf(activePart + '-') === 0;
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setDragging(true);
    dragStateRef.current = { startX: e.clientX, accumulated: 0 };
    viewerRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const delta = e.clientX - dragStateRef.current.startX;
    if (Math.abs(delta - dragStateRef.current.accumulated) >= DRAG_STEP_PX) {
      const dir = delta - dragStateRef.current.accumulated > 0 ? -1 : 1;
      rotateView(dir);
      dragStateRef.current.accumulated = delta;
    }
  }

  function endDrag() {
    setDragging(false);
  }

  return (
    <div className="rounded-sm border border-line bg-panel p-5 pb-2">
      <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-ink-dim">
        <span>SCHEMATIC PREVIEW</span>
      </div>

      <div
        ref={viewerRef}
        className={`relative mx-auto max-w-[340px] touch-pan-y select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        {VIEWS.map((view) => (
          <div
            key={view.index}
            className={view.index === viewIndex ? 'block view-frame-active' : 'hidden'}
          >
            <div
              className="relative mx-auto max-w-[280px] overflow-hidden rounded-sm bg-panel-raised"
              style={{ height: ILLUSTRATION_BOX_HEIGHT }}
            >
              {!failedImages.has(view.index) && (
                <img
                  src={view.imageSrc}
                  alt={view.name}
                  className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                  onError={() => setFailedImages((prev) => new Set(prev).add(view.index))}
                />
              )}
              <svg
                className="absolute inset-0 h-full w-full pointer-events-none"
                viewBox={view.viewBox}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
              >
                {view.parts.map((partDef) => {
                  const resolved = fillByPart.get(partDef.part);
                  const active = isPartActive(partDef.part);
                  return (
                    <g key={partDef.part} data-part={partDef.part}>
                      {partDef.paths.map((p, i) => (
                        <path
                          key={i}
                          className="part-fill"
                          fillRule={p.fillRule}
                          d={p.d}
                          style={{
                            fill: resolved?.fill ?? 'none',
                            fillOpacity: 0.88,
                            mixBlendMode: 'multiply',
                            stroke: active ? '#ff6a3d' : 'none',
                            strokeWidth: active ? 3 : 0,
                            strokeOpacity: active ? 0.9 : 0,
                          }}
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-3.5 pb-2.5">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel"
          title="向左旋轉"
          onClick={() => rotateView(-1)}
        >
          ◀
        </button>
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-mono text-xs text-ink-dim">{VIEW_NAMES[viewIndex]}</span>
          <div className="flex gap-1.5">
            {VIEWS.map((v) => (
              <span
                key={v.index}
                className={`h-1.5 w-1.5 rounded-full ${v.index === viewIndex ? 'bg-signal' : 'bg-line'}`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel"
          title="向右旋轉"
          onClick={() => rotateView(1)}
        >
          ▶
        </button>
      </div>

      {/* Pre-declared gradients, filled from fillByPart - mirrors the fixed
          <defs> block in the legacy markup (~line 422-431) rather than
          creating/removing <linearGradient> nodes on every selection change. */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {ALL_PARTS.map((part) => (
            <linearGradient key={part} id={`grad-${part}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {(fillByPart.get(part)?.stops ?? []).map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          ))}
          {Array.from(patternDefs.values()).map((pattern) => (
            <pattern key={pattern.id} id={pattern.id} patternUnits="userSpaceOnUse" width={pattern.tileSize} height={pattern.tileSize}>
              <rect width={pattern.tileSize} height={pattern.tileSize} fill={pattern.baseColor} />
              {pattern.elements.map((el, i) =>
                el.kind === 'circle' ? (
                  <circle key={i} cx={el.cx} cy={el.cy} r={el.r} fill={el.fill} />
                ) : (
                  <ellipse
                    key={i}
                    cx={el.cx}
                    cy={el.cy}
                    rx={el.rx}
                    ry={el.ry}
                    fill={el.fill}
                    transform={el.rotate ? `rotate(${el.rotate} ${el.cx} ${el.cy})` : undefined}
                  />
                ),
              )}
            </pattern>
          ))}
        </defs>
      </svg>
    </div>
  );
}
