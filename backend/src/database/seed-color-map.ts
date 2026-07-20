// Backend-local copy of frontend/src/lib/color.ts's COLOR_MAP/colorFor.
// Used ONLY at seed time to pre-compute product_options.hex_color as a
// display cache (see docs/database-design.md). The frontend keeps its own
// copy as the live source of truth for swatch/schematic rendering - this
// one never runs outside `npm run seed`, so duplication here is cheaper
// than sharing a package for two files that change together rarely.

const COLOR_MAP: Array<[string, string]> = [
  ['螢光粉', '#ff6fae'], ['螢光黃', '#e8e23f'], ['螢光綠', '#7be86b'], ['螢光橘', '#ff8a3f'],
  ['粉紅迷彩', '#d98fb0'], ['粉色迷彩', '#d98fb0'], ['雪地迷彩', '#d8dee0'], ['陸地迷彩', '#5b6b45'],
  ['海洋迷彩', '#2f6b73'], ['沙漠迷彩', '#c2a06b'], ['數字迷彩', '#6b7a5e'], ['英國迷彩', '#56624a'],
  ['東北大花', '#7a3b6b'], ['豹紋', '#a9793f'],
  ['黃+黑+黃', '#e8e23f'], ['黑+橘+黑', '#ff8a3f'], ['藍+白+藍', '#3f6fd6'], ['粉+黑+粉', '#e8a0c4'], ['紫+白+紫', '#7c5cbf'],
  ['桃紅色', '#e0468a'], ['玫瑰金', '#d9a5a0'], ['鈦合金烤藍', '#3d4f66'],
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
