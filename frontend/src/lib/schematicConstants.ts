// Ported verbatim from 0711檔案.html (~line 1192-1196, 810-813).

export const VIEW_NAMES = ['正面・背帶側', '側面', '背面・氣瓶側'];
export const VIEW_COUNT = 3;

// 每個步驟最適合觀看的視角：開啟步驟時自動轉到能看到該部件的角度
export const PART_BEST_VIEW: Record<string, number> = {
  wing: 0,
  backplate: 0,
  sta: 2,
  weight: 0,
  tank: 2,
};

// 拖曳旋轉：每拖 70px 轉一格
export const DRAG_STEP_PX = 70;

// 依分類組合出清楚的品名，例如「1kg粉色迷彩快扣式」「2kg黑色拉鍊式」
export const WEIGHT_GROUP_META: Record<string, { weightLabel: string; styleLabel: string }> = {
  quick1kg: { weightLabel: '1kg', styleLabel: '快扣式' },
  quick2kg: { weightLabel: '2kg', styleLabel: '快扣式' },
  zip2kg: { weightLabel: '2kg', styleLabel: '拉鍊式' },
};

// autoFillWeight() always seeds the cart from these two fixed SKUs,
// regardless of what else is in the catalog - matches legacy behavior.
export const WEIGHT_QUICK1_SKU = 'wt1-black';
export const WEIGHT_QUICK2_SKU = 'wt2-black';
