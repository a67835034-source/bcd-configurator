// Ported verbatim from 0711檔案.html (~line 505-595). Do not "clean up" the
// match order below - COLOR_MAP is deliberately specific-before-generic
// (e.g. "螢光粉" before a hypothetical generic "粉", "防割黑色" before
// "黑色") so substring matching in colorFor() resolves correctly.

export const COLOR_MAP: Array<[string, string]> = [
  ['螢光粉', '#ff6fae'], ['螢光黃', '#e8e23f'], ['螢光綠', '#7be86b'], ['螢光橘', '#ff8a3f'],
  ['粉紅迷彩', '#d98fb0'], ['粉色迷彩', '#d98fb0'], ['雪地迷彩', '#d8dee0'], ['陸地迷彩', '#5b6b45'],
  ['海洋迷彩', '#2f6b73'], ['沙漠迷彩', '#c2a06b'], ['數字迷彩', '#6b7a5e'], ['英國迷彩', '#56624a'],
  ['東北大花', '#7a3b6b'], ['豹紋', '#a9793f'],
  ['黃+黑+黃', '#e8e23f'], ['黑+橘+黑', '#ff8a3f'], ['藍+白+藍', '#3f6fd6'], ['粉+黑+粉', '#e8a0c4'], ['紫+白+紫', '#7c5cbf'],
  ['桃紅色', '#e0468a'], ['玫瑰金', '#d9a5a0'], ['鈦合金烤藍', '#3d4f66'], ['鐵灰', '#4a4d52'],
  ['白線', '#f2f2f2'], ['橘線', '#ff8a3f'], ['粉線', '#e8a0c4'],
  ['藏青色', '#223a5e'], ['湖藍色', '#3a8fa0'], ['乳白色', '#f3ecdf'], ['米白色', '#f0e6d2'], ['藕色', '#cbb2a6'],
  ['淺紫色', '#b9a3d9'], ['淺藍色', '#a9c6e8'], ['淺灰色', '#b9bfc4'], ['深灰色', '#5b6167'],
  ['防割黑色', '#1c1c1c'], ['防割藍色', '#3f6fd6'], ['防割粉紅色', '#e8a0c4'], ['防割青色', '#3aa0a8'], ['防割灰色', '#8a8f94'],
  ['黑色', '#1c1c1c'], ['白色', '#f2f2f2'], ['紫色', '#7c5cbf'], ['粉色', '#e8a0c4'], ['紅色', '#d64545'],
  ['藍色', '#3f6fd6'], ['灰色', '#8a8f94'], ['金色', '#c9a227'], ['銀色', '#b9c0c4'], ['黃色', '#e8e23f'],
  ['綠色', '#4caf6a'], ['青色', '#3aa0a8'],
  ['不鏽鋼', '#b9c4c9'], ['塑膠', '#2e2e2e'], ['彎鉤', '#cdd3d7'],
];

export function colorFor(name: string): string {
  for (const [k, v] of COLOR_MAP) {
    if (name.includes(k)) return v;
  }
  return '#6a7880';
}

// 非單一顏色品項（迷彩／拼接色）以貼近實際圖片的圖樣呈現，而非單一色塊
export const CAMO_PALETTES: Record<string, [string, string, string, string]> = {
  陸地迷彩: ['#4b5a3a', '#6b7a4e', '#2e3a24', '#8a8f5e'],
  海洋迷彩: ['#1f4d57', '#2f6b73', '#0d2b30', '#5a9aa3'],
  沙漠迷彩: ['#c2a06b', '#a8824c', '#e0c89a', '#7a6136'],
  雪地迷彩: ['#e8ecec', '#c7d0d0', '#ffffff', '#9aa6a6'],
  數字迷彩: ['#5f6b52', '#3d4636', '#8a9370', '#232b1c'],
  英國迷彩: ['#4a4f3a', '#6b5a3f', '#2b2e22', '#8a7c52'],
  粉紅迷彩: ['#e6a0c4', '#f2c9dd', '#c96a97', '#ffffff'],
  粉色迷彩: ['#e6a0c4', '#f2c9dd', '#c96a97', '#ffffff'],
};

export function isLeopardName(name: string): boolean {
  return name.includes('豹紋');
}

export function isFloralName(name: string): boolean {
  return name.includes('大花');
}

// "混色系" (mixed-color series): anything that isn't a single flat color -
// dual/tri-color splices (e.g. "黃+黑+黃") and named patterns (leopard/
// floral). Used to split an option grid into a plain-color section and a
// mixed-color section, e.g. StepAccordionItem's WING 25LBS grid.
export function isMixedColorName(name: string): boolean {
  return name.includes('+') || isLeopardName(name) || isFloralName(name);
}

// Splits an option grid into labeled sub-sections (e.g. WING 25LBS: 單色系 /
// 螢光色系 / 迷彩 / 混色系). Order below is display order.
export type ColorCategory = 'solid' | 'fluorescent' | 'camo' | 'mixed';

export const COLOR_CATEGORY_LABELS: Record<ColorCategory, string> = {
  solid: '單色系',
  fluorescent: '螢光色系',
  camo: '迷彩',
  mixed: '混色系',
};

export const COLOR_CATEGORY_ORDER: ColorCategory[] = ['solid', 'fluorescent', 'camo', 'mixed'];

export function getColorCategory(name: string): ColorCategory {
  if (isMixedColorName(name)) return 'mixed';
  if (name.includes('螢光')) return 'fluorescent';
  if (name.includes('迷彩')) return 'camo';
  return 'solid';
}

// "黃+黑+黃".split('+') -> ["黃","黑","黃"] - single characters too short to
// substring-match COLOR_MAP's full-word entries (e.g. "黃".includes("黃色")
// is false), so every split fragment silently fell back to the default
// grey (#6a7880) instead of its real color. Dedicated single-character map
// for exactly the characters that appear in "+"-combo names.
const SPLIT_COLOR_CHARS: Record<string, string> = {
  黃: '#e8e23f',
  黑: '#1c1c1c',
  橘: '#ff8a3f',
  藍: '#3f6fd6',
  白: '#f2f2f2',
  粉: '#e8a0c4',
  紫: '#7c5cbf',
  紅: '#d64545',
  綠: '#4caf6a',
  灰: '#8a8f94',
  金: '#c9a227',
  銀: '#b9c0c4',
  青: '#3aa0a8',
};

function colorForSplitChar(char: string): string {
  return SPLIT_COLOR_CHARS[char] ?? colorFor(char);
}

// CSS pattern for UI swatch tiles (background-image). null => solid color.
// Leopard/floral are stitched from several radial-gradients (blotches /
// rose blobs + leaf accents) rather than a single color, so the tiny color
// chip in the option grid actually reads as "leopard print" / "floral
// print" instead of a flat tan or a rainbow smear.
export function patternFor(name: string): string | null {
  // 三色拼接，例如「黃+黑+黃」→ 依序水平分色
  if (name.includes('+')) {
    const parts = name.split('+').map((p) => colorForSplitChar(p));
    const n = parts.length;
    const stops = parts
      .map((c, i) => `${c} ${Math.round((i * 100) / n)}% ${Math.round(((i + 1) * 100) / n)}%`)
      .join(', ');
    return `linear-gradient(90deg, ${stops})`;
  }
  for (const key in CAMO_PALETTES) {
    if (name.includes(key)) {
      const [c1, c2, c3, c4] = CAMO_PALETTES[key];
      return `repeating-linear-gradient(45deg, ${c1} 0 6px, ${c2} 6px 12px, ${c3} 12px 18px, ${c4} 18px 24px)`;
    }
  }
  if (isLeopardName(name)) {
    // Colors sampled from the actual product photo (frontend/public/images/
    // wing/w25-leopard.jpg) - see LEOPARD_PATTERN below for the SVG twin.
    return [
      'radial-gradient(ellipse 7px 5px at 15% 20%, #1a100b 60%, transparent 62%)',
      'radial-gradient(ellipse 6px 4.5px at 55% 12%, #1a100b 60%, transparent 62%)',
      'radial-gradient(ellipse 7px 5px at 85% 30%, #1a100b 60%, transparent 62%)',
      'radial-gradient(ellipse 6.5px 5px at 30% 55%, #1a100b 60%, transparent 62%)',
      'radial-gradient(ellipse 6px 4.5px at 75% 65%, #1a100b 60%, transparent 62%)',
      'radial-gradient(ellipse 5px 4px at 10% 80%, #1a100b 60%, transparent 62%)',
      'radial-gradient(ellipse 6px 4.5px at 55% 88%, #1a100b 60%, transparent 62%)',
      'linear-gradient(#a3611a, #a3611a)',
    ].join(', ');
  }
  if (isFloralName(name)) {
    // Colors sampled from the actual product photo (frontend/public/images/
    // wing/w25-flower.jpg) - see FLORAL_PATTERN below for the SVG twin.
    return [
      'radial-gradient(circle at 20% 20%, #ffffff 0 3px, #eec3d6 3px 8px, transparent 9px)',
      'radial-gradient(circle at 70% 15%, #ffffff 0 2.5px, #eec3d6 2.5px 7px, transparent 8px)',
      'radial-gradient(circle at 45% 55%, #ffffff 0 3px, #eec3d6 3px 8px, transparent 9px)',
      'radial-gradient(circle at 15% 75%, #ffffff 0 2.5px, #eec3d6 2.5px 7px, transparent 8px)',
      'radial-gradient(circle at 80% 70%, #3f6420 0 2px, transparent 3px)',
      'radial-gradient(circle at 35% 32%, #3f6420 0 2px, transparent 3px)',
      'linear-gradient(#c11018, #c11018)',
    ].join(', ');
  }
  return null;
}

export interface SwatchCSS {
  backgroundImage?: string;
  background?: string;
}

export function swatchStyle(name: string): SwatchCSS {
  const pattern = patternFor(name);
  return pattern ? { backgroundImage: pattern } : { background: colorFor(name) };
}

// 給示意圖線稿用：回傳顏色陣列（用來畫 SVG 漸層條紋）或 null（單一色）
// Leopard/floral are intentionally NOT handled here - a <linearGradient>
// can only produce stripes, never spots or flower blobs, so they get a
// dedicated SVG <pattern> instead (see PatternDef below / fillForPart).
export function paletteFor(name: string): string[] | null {
  if (name.includes('+')) return name.split('+').map((p) => colorForSplitChar(p));
  for (const key in CAMO_PALETTES) {
    if (name.includes(key)) return CAMO_PALETTES[key];
  }
  return null;
}

export interface GradientStop {
  offset: string;
  color: string;
}

// Same math as the legacy setGradientStops(), just returned as data instead
// of imperatively writing <stop> elements - SchematicViewer renders these
// declaratively inside a React <linearGradient>.
export function gradientStopsFor(colors: string[]): GradientStop[] {
  const n = colors.length;
  const stops: GradientStop[] = [];
  colors.forEach((c, i) => {
    const start = ((i * 100) / n).toFixed(1);
    const end = (((i + 1) * 100) / n).toFixed(1);
    stops.push({ offset: `${start}%`, color: c });
    stops.push({ offset: `${end}%`, color: c });
  });
  return stops;
}

// SVG <pattern> tile definitions for leopard print / floral print - the
// schematic illustration's equivalent of patternFor() above. Colors are
// shared with patternFor() so the small swatch chip and the big
// illustration read as the same pattern, just at different scales.
export type PatternElement =
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: string }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string; rotate?: number };

export interface PatternDef {
  id: string;
  tileSize: number;
  baseColor: string;
  elements: PatternElement[];
}

// Colors sampled directly from frontend/public/images/wing/w25-leopard.jpg
// (quantized pixel histogram: warm caramel base, near-black spots).
export const LEOPARD_PATTERN: PatternDef = {
  id: 'pattern-leopard',
  tileSize: 60,
  baseColor: '#a3611a',
  elements: [
    { kind: 'ellipse', cx: 12, cy: 14, rx: 7, ry: 5, fill: '#1a100b', rotate: -15 },
    { kind: 'ellipse', cx: 38, cy: 8, rx: 6, ry: 4.5, fill: '#1a100b', rotate: 20 },
    { kind: 'ellipse', cx: 50, cy: 30, rx: 7, ry: 5, fill: '#1a100b', rotate: -10 },
    { kind: 'ellipse', cx: 20, cy: 40, rx: 6.5, ry: 5, fill: '#1a100b', rotate: 30 },
    { kind: 'ellipse', cx: 45, cy: 52, rx: 6, ry: 4.5, fill: '#1a100b', rotate: -25 },
    { kind: 'ellipse', cx: 5, cy: 50, rx: 5, ry: 4, fill: '#1a100b', rotate: 15 },
  ],
};

// Colors sampled directly from frontend/public/images/wing/w25-flower.jpg
// (quantized pixel histogram: true red base, soft pink petals, olive leaves).
export const FLORAL_PATTERN: PatternDef = {
  id: 'pattern-floral',
  tileSize: 70,
  baseColor: '#c11018',
  elements: [
    { kind: 'circle', cx: 18, cy: 16, r: 7, fill: '#eec3d6' },
    { kind: 'circle', cx: 18, cy: 16, r: 3, fill: '#ffffff' },
    { kind: 'circle', cx: 52, cy: 10, r: 6, fill: '#eec3d6' },
    { kind: 'circle', cx: 52, cy: 10, r: 2.5, fill: '#ffffff' },
    { kind: 'circle', cx: 40, cy: 45, r: 7.5, fill: '#eec3d6' },
    { kind: 'circle', cx: 40, cy: 45, r: 3, fill: '#ffffff' },
    { kind: 'circle', cx: 10, cy: 52, r: 6, fill: '#eec3d6' },
    { kind: 'circle', cx: 10, cy: 52, r: 2.5, fill: '#ffffff' },
    { kind: 'ellipse', cx: 30, cy: 10, rx: 4, ry: 2.5, fill: '#3f6420', rotate: 30 },
    { kind: 'ellipse', cx: 58, cy: 35, rx: 4, ry: 2.5, fill: '#3f6420', rotate: -20 },
    { kind: 'ellipse', cx: 20, cy: 60, rx: 4, ry: 2.5, fill: '#3f6420', rotate: 60 },
  ],
};

export function specialSvgPatternFor(name: string): PatternDef | null {
  if (isLeopardName(name)) return LEOPARD_PATTERN;
  if (isFloralName(name)) return FLORAL_PATTERN;
  return null;
}

// Resolves what a schematic part should be filled with: a solid hex color,
// a reference to a <linearGradient> (stops from gradientStopsFor(paletteFor
// (name))), or a reference to a shared <pattern> (leopard/floral).
export function fillForPart(
  part: string,
  name: string,
):
  | { type: 'solid'; color: string }
  | { type: 'gradient'; gradientId: string }
  | { type: 'pattern'; pattern: PatternDef } {
  const specialPattern = specialSvgPatternFor(name);
  if (specialPattern) {
    return { type: 'pattern', pattern: specialPattern };
  }
  const palette = paletteFor(name);
  if (palette) {
    return { type: 'gradient', gradientId: `grad-${part}` };
  }
  return { type: 'solid', color: colorFor(name) };
}
