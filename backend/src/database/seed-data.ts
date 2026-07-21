// Literal port of the STEPS array from 0711檔案.html (~line 634-792). This
// is the one-time migration path from the hardcoded frontend array into
// rows - seed.ts reads this and writes product_steps/option_groups/
// product_options. Field names intentionally match the legacy object shape
// (num/part/sub/desc/priceRMB/def/img) so this can be diffed against the
// original array by eye.

export interface SeedOption {
  id: string;
  group?: string;
  name: string;
  priceRMB: number;
  weight: number | null;
  capacity?: number;
  badge?: string;
  def?: boolean;
  img?: string; // full product photo -> rendered as a large tile (e.g. tank band)
  swatchImg?: string; // cropped fabric/pattern texture -> rendered as a small chip
  // false = priced at cost, MARKUP_MULTIPLIER not applied - defaults to true
  // (every option is marked up) when omitted. Used by the add-ons, which are
  // sold at cost regardless of the main catalog's markup setting.
  applyMarkup?: boolean;
}

export interface SeedGroup {
  id: string;
  label: string;
  tagline?: string; // short buyer-guidance label on the tab button, e.g. "輕便優先"
  recommendation?: string; // one-sentence "who this is for", e.g. "適合喜愛輕裝旅遊的潛水員。"
  parentLabel?: string; // groups sharing this collapse into one tab, e.g. STA's 3 alu specs -> "鋁板"
}

export interface SeedStep {
  id: string;
  num: string;
  part: string;
  title: string;
  sub: string;
  desc: string;
  note?: string; // short disclaimer near the title, e.g. weight-calculation caveat
  referenceImage?: string;
  referenceImageCaption?: string;
  groups?: SeedGroup[];
  specNote?: Record<string, string>;
  options: SeedOption[];
}

export const STEP_SEED_DATA: SeedStep[] = [
  {
    id: 'wing',
    num: '01',
    part: 'wing',
    title: 'WING',
    sub: '背囊',
    desc: '依浮力噸位分為 18lbs／25lbs／30lbs防割三種，先選噸位再選顏色。',
    groups: [
      { id: '18', label: '18LBS', tagline: '輕便優先', recommendation: '適合喜愛輕裝旅遊的潛水員。' },
      { id: '25', label: '25LBS', tagline: '通用平衡', recommendation: '最穩妥的選擇，適合大多數人的日常需求。' },
      { id: '30', label: '30LBS 防割', tagline: '耐用安全', recommendation: '適合追求裝備耐用度，或是潛水環境較嚴苛的進階潛水員。' },
    ],
    specNote: {
      '18': '1050D 耐磨拉外囊／耐水解TPU塗層內囊／進口K閥＋大波紋管／尺寸20×55cm／重量1.08kg',
      '25': '1050D 尼龍外囊，Cordura材質／420D內囊／TPU接頭／尼龍螺母圈／ABS大蓋／充氣後64×38×13.5cm／重量1.15kg／可現場軟硬背負切換，可定制批發',
      '30': '超聚合PE＋玻纖防割外囊／420D尼龍內囊／防割等級EN388-4級／BOM:14吋扁管/24吋低壓管/軟支架/4吋方槽／充氣尺寸62×40×20cm／重量1kg',
    },
    options: [
      { id: 'w18-black', group: '18', name: '黑色', priceRMB: 1000, weight: 1.08, badge: '熱銷', def: true, img: '/images/wing/w18-black.png' },
      { id: 'w18-ocean', group: '18', name: '海洋迷彩', priceRMB: 1000, weight: 1.08, img: '/images/wing/w18-ocean.png' },
      { id: 'w18-land', group: '18', name: '陸地迷彩', priceRMB: 1000, weight: 1.08, img: '/images/wing/w18-land.png' },
      { id: 'w18-digital', group: '18', name: '數字迷彩', priceRMB: 1000, weight: 1.08, img: '/images/wing/w18-digital.png' },
      { id: 'w18-pink', group: '18', name: '粉色迷彩', priceRMB: 1000, weight: 1.08, img: '/images/wing/w18-pink.png' },
      { id: 'w18-purple', group: '18', name: '紫色', priceRMB: 1000, weight: 1.08, img: '/images/wing/w18-purple.png' },
      { id: 'w18-pinkplain', group: '18', name: '粉色', priceRMB: 1000, weight: 1.08, img: '/images/wing/w18-pinkplain.png' },

      { id: 'w25-black', group: '25', name: '黑色', priceRMB: 1240, weight: 1.15, def: true, img: '/images/wing/w25-black.png' },
      { id: 'w25-fuchsia', group: '25', name: '桃紅色', priceRMB: 1240, weight: 1.15, img: '/images/wing/w25-fuchsia.png' },
      { id: 'w25-snow', group: '25', name: '雪地迷彩', priceRMB: 1240, weight: 1.15, img: '/images/wing/w25-snow.png' },
      { id: 'w25-purple', group: '25', name: '紫色', priceRMB: 1240, weight: 1.15, img: '/images/wing/w25-purple.png' },
      { id: 'w25-ocean', group: '25', name: '海洋迷彩', priceRMB: 1240, weight: 1.15, img: '/images/wing/w25-ocean.png' },
      { id: 'w25-desert', group: '25', name: '沙漠迷彩', priceRMB: 1240, weight: 1.15, img: '/images/wing/w25-desert.png' },
      { id: 'w25-fpink', group: '25', name: '螢光粉', priceRMB: 1340, weight: 1.15, img: '/images/wing/w25-fpink.png' },
      { id: 'w25-fyellow', group: '25', name: '螢光黃', priceRMB: 1340, weight: 1.15, img: '/images/wing/w25-fyellow.png' },
      { id: 'w25-fgreen', group: '25', name: '螢光綠', priceRMB: 1340, weight: 1.15, img: '/images/wing/w25-fgreen.png' },
      { id: 'w25-forange', group: '25', name: '螢光橘', priceRMB: 1340, weight: 1.15, img: '/images/wing/w25-forange.png' },
      { id: 'w25-pinkcamo', group: '25', name: '粉紅迷彩', priceRMB: 1240, weight: 1.15, img: '/images/wing/w25-pinkcamo.png' },
      { id: 'w25-white', group: '25', name: '白色', priceRMB: 1340, weight: 1.15, img: '/images/wing/w25-white.png' },
      { id: 'w25-red', group: '25', name: '紅色', priceRMB: 1240, weight: 1.15, img: '/images/wing/w25-red.png' },
      { id: 'w25-grey', group: '25', name: '灰色', priceRMB: 1240, weight: 1.15, img: '/images/wing/w25-grey.png' },
      {
        id: 'w25-yby',
        group: '25',
        name: '黃+黑+黃',
        priceRMB: 1290,
        weight: 1.15,
        img: '/images/wing/w25-yby.png',
      },
      {
        id: 'w25-hob',
        group: '25',
        name: '黑+橘+黑',
        priceRMB: 1290,
        weight: 1.15,
        img: '/images/wing/w25-hob.png',
      },
      {
        id: 'w25-bwb',
        group: '25',
        name: '藍+白+藍',
        priceRMB: 1290,
        weight: 1.15,
        img: '/images/wing/w25-bwb.png',
      },
      {
        id: 'w25-pbp',
        group: '25',
        name: '粉+黑+粉',
        priceRMB: 1290,
        weight: 1.15,
        img: '/images/wing/w25-pbp.png',
      },
      {
        id: 'w25-pwp',
        group: '25',
        name: '紫+白+紫',
        priceRMB: 1290,
        weight: 1.15,
        img: '/images/wing/w25-pwp.png',
      },
      {
        id: 'w25-wbw',
        group: '25',
        name: '白+黑+白',
        priceRMB: 1290,
        weight: 1.15,
        img: '/images/wing/w25-wbw.png',
      },
      {
        id: 'w25-leopard',
        group: '25',
        name: '豹紋',
        priceRMB: 1200,
        weight: 1.15,
        img: '/images/wing/w25-leopard.png',
      },
      {
        id: 'w25-flower',
        group: '25',
        name: '東北大花',
        priceRMB: 1200,
        weight: 1.15,
        badge: '多人加購',
        img: '/images/wing/w25-flower.png',
      },

      { id: 'w30-black', group: '30', name: '防割黑色', priceRMB: 1900, weight: 1.0, img: '/images/wing/w30-black.png' },
      { id: 'w30-blue', group: '30', name: '防割藍色', priceRMB: 1900, weight: 1.0, img: '/images/wing/w30-blue.png' },
      { id: 'w30-pink', group: '30', name: '防割粉紅色', priceRMB: 1900, weight: 1.0, img: '/images/wing/w30-pink.png' },
      { id: 'w30-cyan', group: '30', name: '防割青色', priceRMB: 1900, weight: 1.0, img: '/images/wing/w30-cyan.png' },
      { id: 'w30-grey', group: '30', name: '防割灰色', priceRMB: 1900, weight: 1.0, img: '/images/wing/w30-grey.png' },
    ],
  },
  {
    id: 'backplate',
    num: '02',
    part: 'backplate',
    title: 'BACKPLATE',
    sub: '背板',
    desc: '依材質分為不鏽鋼／鈦合金／輕量化鋁／鋁板／碳纖維，先選材質再選顏色。',
    note: '以下背板重量都已包含背負帶約1kg',
    referenceImage: '/images/backplate/bp-band.jpg',
    referenceImageCaption: '所有背板皆已包含此背負帶',
    groups: [
      { id: 'steel', label: '不鏽鋼' },
      { id: 'titanium', label: '鈦合金' },
      { id: 'light-alu', label: '輕量化鋁' },
      { id: 'plate-alu', label: '鋁板' },
      { id: 'carbon', label: '碳纖維' },
    ],
    specNote: {
      steel: '304／316不鏽鋼，噴砂電解拋光或鏡面處理，重量約3.3kg，耐用度最高',
      titanium: '鈦合金背板，質感輕量，重量約2.32kg，提供烤藍與本色兩種處理',
      'light-alu': '5052輕量化鋁背板，重量約1.5kg',
      'plate-alu': '一般鋁合金背板，重量約1.82kg，色彩選擇最多',
      carbon: '碳纖維背板，重量約1.52kg，質輕且具高階質感',
    },
    options: [
      { id: 'bp-ss304', group: 'steel', name: '乳白色 SS304噴砂電解', priceRMB: 740, weight: 3.3, def: true, img: '/images/backplate/bp-ss304.png' },
      { id: 'bp-ss316', group: 'steel', name: '白色 SS316鏡面', priceRMB: 770, weight: 3.3, img: '/images/backplate/bp-ss316.png' },
      { id: 'bp-ti', group: 'titanium', name: '鈦合金烤藍', priceRMB: 1270, weight: 2.32, img: '/images/backplate/bp-ti.png' },
      { id: 'bp-ti-natural', group: 'titanium', name: '鈦合金本色', priceRMB: 1270, weight: 2.32, img: '/images/backplate/bp-ti-natural.png' },
      { id: 'bp-light-black', group: 'light-alu', name: '輕量化鋁－黑色', priceRMB: 740, weight: 1.5, img: '/images/backplate/bp-light-black.png' },
      { id: 'bp-light-silver', group: 'light-alu', name: '輕量化鋁－銀色', priceRMB: 740, weight: 1.5, img: '/images/backplate/bp-light-silver.png' },
      { id: 'bp-plate-black', group: 'plate-alu', name: '黑色鋁板', priceRMB: 710, weight: 1.82, img: '/images/backplate/bp-plate-black.png' },
      { id: 'bp-plate-red', group: 'plate-alu', name: '紅色鋁板', priceRMB: 710, weight: 1.82, img: '/images/backplate/bp-plate-red.png' },
      { id: 'bp-plate-hardgrey', group: 'plate-alu', name: '灰色硬氧鋁板', priceRMB: 770, weight: 1.82, img: '/images/backplate/bp-plate-hardgrey.png' },
      { id: 'bp-plate-gold', group: 'plate-alu', name: '金色鋁板', priceRMB: 710, weight: 1.82, img: '/images/backplate/bp-plate-gold.png' },
      { id: 'bp-plate-blue', group: 'plate-alu', name: '藍色鋁板', priceRMB: 710, weight: 1.82, img: '/images/backplate/bp-plate-blue.png' },
      { id: 'bp-plate-pink', group: 'plate-alu', name: '粉色鋁板', priceRMB: 710, weight: 1.82, img: '/images/backplate/bp-plate-pink.png' },
      { id: 'bp-plate-silver', group: 'plate-alu', name: '銀色鋁板', priceRMB: 710, weight: 1.82, img: '/images/backplate/bp-plate-silver.png' },
      { id: 'bp-plate-mini', group: 'plate-alu', name: '迷你鋁背板', priceRMB: 710, weight: 1.82, img: '/images/backplate/bp-plate-mini.png' },
      { id: 'bp-carbon', group: 'carbon', name: '碳纖維－黑色', priceRMB: 1170, weight: 1.52, badge: '多人加購', img: '/images/backplate/bp-carbon.png' },
      { id: 'bp-carbon-pink', group: 'carbon', name: '碳纖維－粉紅色', priceRMB: 1260, weight: 1.52, img: '/images/backplate/bp-carbon-pink.png' },
      { id: 'bp-carbon-cream', group: 'carbon', name: '碳纖維－米白色', priceRMB: 1260, weight: 1.52, img: '/images/backplate/bp-carbon-cream.png' },
      { id: 'bp-carbon-purple', group: 'carbon', name: '碳纖維－紫色', priceRMB: 1260, weight: 1.52, img: '/images/backplate/bp-carbon-purple.png' },
      { id: 'bp-carbon-mint', group: 'carbon', name: '碳纖維－薄荷綠色', priceRMB: 1260, weight: 1.52, img: '/images/backplate/bp-carbon-mint.png' },
    ],
  },
  {
    id: 'sta',
    num: '03',
    part: 'sta',
    title: 'STA',
    sub: '氣瓶板',
    desc: '孔距28cm、孔尺寸10×10mm，先選材質再選顏色。',
    referenceImage: '/images/sta/sta-screws.png',
    referenceImageCaption: '任何氣瓶板皆附316不鏽鋼固定螺絲×2',
    groups: [
      { id: 'alu-3mm-light', label: '3mm輕量化鋁板', parentLabel: '鋁板' },
      { id: 'alu-3mm', label: '3mm鋁板', parentLabel: '鋁板' },
      { id: 'alu-2mm', label: '2mm鋁板', parentLabel: '鋁板' },
      { id: 'steel', label: '不鏽鋼' },
      { id: 'titanium', label: '鈦合金' },
      { id: 'carbon', label: '碳纖維' },
    ],
    specNote: {
      'alu-3mm-light': '5052硬質鋁，噴砂加陽極氧化處理，輕量化打孔設計，重量0.17kg',
      'alu-3mm': '5052硬質鋁，噴砂加陽極氧化處理，重量0.17kg',
      'alu-2mm': '5052硬質鋁，噴砂加陽極氧化處理，重量0.11kg',
      steel: '304不鏽鋼，噴砂電解拋光防生鏽處理，2mm厚，重量0.31kg',
      carbon: '碳纖維氣瓶板，重量0.087kg',
    },
    options: [
      { id: 'sta-3mm-black', group: 'alu-3mm-light', name: '輕量化黑色', priceRMB: 129, weight: 0.17, def: true, img: '/images/sta/sta-3mm-black.png' },
      { id: 'sta-3mm-silver', group: 'alu-3mm-light', name: '輕量化銀色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-silver.png' },
      { id: 'sta-3mm-purple', group: 'alu-3mm-light', name: '輕量化紫色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-purple.png' },
      { id: 'sta-3mm-gold', group: 'alu-3mm-light', name: '輕量化金色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-gold.png' },
      { id: 'sta-3mm-blue', group: 'alu-3mm-light', name: '輕量化藍色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-blue.png' },
      { id: 'sta-3mm-rose', group: 'alu-3mm-light', name: '輕量化玫瑰金', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-rose.png' },
      { id: 'sta-3mm-red', group: 'alu-3mm-light', name: '輕量化紅色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-red.png' },
      { id: 'sta-2mm-red', group: 'alu-2mm', name: '紅色', priceRMB: 129, weight: 0.11, img: '/images/sta/sta-2mm-red.png' },
      { id: 'sta-2mm-rose', group: 'alu-2mm', name: '玫瑰金', priceRMB: 129, weight: 0.11, img: '/images/sta/sta-2mm-rose.png' },
      { id: 'sta-2mm-blue', group: 'alu-2mm', name: '藍色', priceRMB: 129, weight: 0.11, img: '/images/sta/sta-2mm-blue.png' },
      { id: 'sta-2mm-silver', group: 'alu-2mm', name: '銀色', priceRMB: 129, weight: 0.11, img: '/images/sta/sta-2mm-silver.png' },
      { id: 'sta-3mm-grey', group: 'alu-3mm', name: '灰色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-grey.png' },
      { id: 'sta-3mm-std-rose', group: 'alu-3mm', name: '玫瑰金', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-std-rose.png' },
      { id: 'sta-3mm-std-gold', group: 'alu-3mm', name: '金黃色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-std-gold.png' },
      { id: 'sta-3mm-std-red', group: 'alu-3mm', name: '紅色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-std-red.png' },
      { id: 'sta-3mm-std-blue', group: 'alu-3mm', name: '藍色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-std-blue.png' },
      { id: 'sta-3mm-std-silver', group: 'alu-3mm', name: '銀色', priceRMB: 129, weight: 0.17, img: '/images/sta/sta-3mm-std-silver.png' },
      { id: 'sta-2mm-ss', group: 'steel', name: '2mm銀色不鏽鋼', priceRMB: 129, weight: 0.31, badge: '多人加購', img: '/images/sta/sta-2mm-ss.png' },
      { id: 'sta-ti', group: 'titanium', name: '鈦合金', priceRMB: 309, weight: 0.2, img: '/images/sta/sta-ti.png' },
      { id: 'sta-carbon-black', group: 'carbon', name: '碳纖維－黑色', priceRMB: 199, weight: 0.087, badge: '90%加購', img: '/images/sta/sta-carbon-black.png' },
      { id: 'sta-carbon-purple', group: 'carbon', name: '碳纖維－紫色', priceRMB: 229, weight: 0.087, img: '/images/sta/sta-carbon-purple.png' },
      { id: 'sta-carbon-cream', group: 'carbon', name: '碳纖維－米白色', priceRMB: 229, weight: 0.087, img: '/images/sta/sta-carbon-cream.png' },
      { id: 'sta-carbon-mint', group: 'carbon', name: '碳纖維－薄荷綠', priceRMB: 229, weight: 0.087, img: '/images/sta/sta-carbon-mint.png' },
    ],
  },
  {
    id: 'weight',
    num: '04',
    part: 'weight',
    title: 'WEIGHT POCKETS',
    sub: '配重袋',
    desc: '依款式分為快扣式／拉鍊式；可直接輸入目標配重公斤數，系統會自動帶入建議數量，也能手動調整每款數量。',
    groups: [
      { id: 'quick1kg', label: '快扣式・1KG' },
      { id: 'quick2kg', label: '快扣式・2KG' },
      { id: 'zip2kg', label: '拉鍊式・2KG' },
    ],
    specNote: {
      quick1kg: '定位扣快拆式，單邊1kg實心配重，一對（雙邊）合計可配重約2kg',
      quick2kg: '定位扣快拆式，單邊2kg實心配重，一對（雙邊）合計可配重約4kg',
      zip2kg:
        '拉鍊式可拆卸配重袋，無定位扣，單邊容量上限2kg，一對合計可配重約4kg，需自行填充鉛粒；空袋本身重量約0.13kg／單邊（僅計入裝備總重量，不影響可配重數字）。',
    },
    options: [
      { id: 'wt1-black', group: 'quick1kg', name: '黑色', priceRMB: 68, weight: 0.13, capacity: 2, def: true, img: '/images/weight/wt1-black.png' },
      { id: 'wt1-desert', group: 'quick1kg', name: '沙漠迷彩', priceRMB: 78, weight: 0.13, capacity: 2, img: '/images/weight/wt1-desert.png' },
      { id: 'wt1-land', group: 'quick1kg', name: '陸地迷彩', priceRMB: 78, weight: 0.13, capacity: 2, img: '/images/weight/wt1-land.png' },
      { id: 'wt1-uk', group: 'quick1kg', name: '英國迷彩', priceRMB: 78, weight: 0.13, capacity: 2, img: '/images/weight/wt1-uk.png' },
      { id: 'wt1-pink', group: 'quick1kg', name: '粉色迷彩', priceRMB: 78, weight: 0.13, capacity: 2, img: '/images/weight/wt1-pink.png' },
      { id: 'wt1-ocean', group: 'quick1kg', name: '海洋迷彩', priceRMB: 78, weight: 0.13, capacity: 2, img: '/images/weight/wt1-ocean.png' },

      { id: 'wt2-black', group: 'quick2kg', name: '黑色', priceRMB: 79, weight: 0.13, capacity: 4, img: '/images/weight/wt2-black.png' },
      { id: 'wt2-pink', group: 'quick2kg', name: '粉色迷彩', priceRMB: 79, weight: 0.13, capacity: 4, img: '/images/weight/wt2-pink.png' },
      { id: 'wt2-ocean', group: 'quick2kg', name: '海洋迷彩', priceRMB: 79, weight: 0.13, capacity: 4, img: '/images/weight/wt2-ocean.png' },
      { id: 'wt2-land', group: 'quick2kg', name: '陸地迷彩', priceRMB: 79, weight: 0.13, capacity: 4, img: '/images/weight/wt2-land.png' },
      { id: 'wt2-desert', group: 'quick2kg', name: '沙漠迷彩', priceRMB: 79, weight: 0.13, capacity: 4, img: '/images/weight/wt2-desert.png' },
      { id: 'wt2-uk', group: 'quick2kg', name: '英國迷彩', priceRMB: 79, weight: 0.13, capacity: 4, img: '/images/weight/wt2-uk.png' },
      { id: 'wt2-purple', group: 'quick2kg', name: '紫色', priceRMB: 79, weight: 0.13, capacity: 4, img: '/images/weight/wt2-purple.png' },

      { id: 'wtz-black', group: 'zip2kg', name: '黑色', priceRMB: 68, weight: 0.26, capacity: 4, badge: '推薦', img: '/images/weight/wtz-black.png' },
      { id: 'wtz-pink', group: 'zip2kg', name: '粉紅迷彩', priceRMB: 78, weight: 0.26, capacity: 4, img: '/images/weight/wtz-pink.png' },
      { id: 'wtz-ocean', group: 'zip2kg', name: '海洋迷彩', priceRMB: 78, weight: 0.26, capacity: 4, img: '/images/weight/wtz-ocean.png' },
      { id: 'wtz-uk', group: 'zip2kg', name: '英國迷彩', priceRMB: 78, weight: 0.26, capacity: 4, img: '/images/weight/wtz-uk.png' },
      { id: 'wtz-desert', group: 'zip2kg', name: '沙漠迷彩', priceRMB: 78, weight: 0.26, capacity: 4, img: '/images/weight/wtz-desert.png' },
      { id: 'wtz-land', group: 'zip2kg', name: '陸地迷彩', priceRMB: 78, weight: 0.26, capacity: 4, img: '/images/weight/wtz-land.png' },
    ],
  },
  {
    id: 'tank',
    num: '05',
    part: 'tank',
    title: 'TANK BAND',
    sub: '氣瓶固定帶',
    desc: '固定鋼瓶於背板的束帶系統，材質影響耐用度與拆裝手感。',
    options: [
      {
        id: 'tb-new-ss316',
        name: '新款316不鏽鋼',
        priceRMB: 109,
        weight: null,
        badge: '推薦',
        def: true,
        img: '/images/tank-band/tb-new-ss316.jpg',
      },
      { id: 'tb-classic-ss316', name: '經典款316不鏽鋼', priceRMB: 99, weight: null, img: '/images/tank-band/tb-classic-ss316.jpg' },
      { id: 'tb-plastic', name: '塑膠', priceRMB: 59, weight: null, img: '/images/tank-band/tb-plastic.jpg' },
      { id: 'tb-hook', name: '彎鉤加梯形扣', priceRMB: 149, weight: null, img: '/images/tank-band/tb-hook.jpg' },
    ],
  },
  {
    // Not shown in the main configurator accordion (frontend's StepList
    // filters it out) - only surfaced via AddonUpsellModal, the "跳出可以
    // 加價購的項目" popup shown right before checkout. Modeled as a real
    // catalog step (not a hardcoded frontend list) so these get proper
    // SKU/TWD pricing through the same exchange-rate/markup pipeline as
    // everything else, and show up correctly in order records, the
    // receipt image, and LINE notifications.
    id: 'addon',
    num: '06',
    part: 'addon',
    title: 'ADD-ONS',
    sub: '加購商品',
    desc: '結帳前可加購的推薦配件（選填）。',
    groups: [
      { id: 'addon-spool-alu-30m', label: '30m鋁合金線軸' },
      { id: 'addon-spool-plastic-30m', label: '30m塑膠線軸' },
      { id: 'addon-flashlight', label: '散光超亮手電筒' },
    ],
    specNote: {
      // Unlike the aluminum spool (whole product changes color), the
      // plastic spool's body always stays black - "color" here means the
      // line/cord wound on it. Shown as a small caption under the product
      // title in AddonUpsellModal so this isn't mistaken for a spool-body color.
      'addon-spool-plastic-30m': '主要線軸為黑色，顏色選擇為「線材」',
      'addon-flashlight': '使用18650電池四顆',
      // NOTE: specNote is only ever persisted/served per *group* (see
      // seed.ts + products.service.ts, both keyed off OptionGroup rows) -
      // it can't hold a note for a flat option like addon-dsmb. That note
      // lives in frontend/src/components/CheckoutBar/AddonUpsellModal.tsx
      // (FLAT_OPTION_NOTES) instead.
    },
    // Every option below is applyMarkup: false - add-ons are sold at cost
    // (RMB * exchange rate only), not subject to MARKUP_MULTIPLIER like the
    // rest of the catalog.
    options: [
      { id: 'addon-dsmb', name: 'DSMB浮力帶', priceRMB: 148, weight: null, img: '/images/addon/addon-dsmb.png', applyMarkup: false },
      // Test case for photo + color-swatch add-ons (see AddonUpsellModal) -
      // img paths ready for the photos once supplied, matching
      // frontend/public/images/addon/ filenames.
      { id: 'addon-spool-alu-30m-black', group: 'addon-spool-alu-30m', name: '黑色', priceRMB: 99, weight: null, def: true, img: '/images/addon/addon-spool-alu-30m-black.png', applyMarkup: false },
      { id: 'addon-spool-alu-30m-blue', group: 'addon-spool-alu-30m', name: '藍色', priceRMB: 99, weight: null, img: '/images/addon/addon-spool-alu-30m-blue.png', applyMarkup: false },
      { id: 'addon-spool-alu-30m-rose', group: 'addon-spool-alu-30m', name: '玫瑰金', priceRMB: 99, weight: null, img: '/images/addon/addon-spool-alu-30m-rose.png', applyMarkup: false },
      { id: 'addon-spool-alu-30m-gunmetal', group: 'addon-spool-alu-30m', name: '鐵灰', priceRMB: 99, weight: null, img: '/images/addon/addon-spool-alu-30m-gunmetal.png', applyMarkup: false },
      { id: 'addon-spool-alu-30m-red', group: 'addon-spool-alu-30m', name: '紅色', priceRMB: 99, weight: null, img: '/images/addon/addon-spool-alu-30m-red.png', applyMarkup: false },
      { id: 'addon-spool-plastic-30m-white', group: 'addon-spool-plastic-30m', name: '白線', priceRMB: 59, weight: null, def: true, img: '/images/addon/addon-spool-plastic-30m-white.png', applyMarkup: false },
      { id: 'addon-spool-plastic-30m-orange', group: 'addon-spool-plastic-30m', name: '橘線', priceRMB: 59, weight: null, img: '/images/addon/addon-spool-plastic-30m-orange.png', applyMarkup: false },
      { id: 'addon-spool-plastic-30m-fyellow', group: 'addon-spool-plastic-30m', name: '螢光黃線', priceRMB: 59, weight: null, img: '/images/addon/addon-spool-plastic-30m-fyellow.png', applyMarkup: false },
      { id: 'addon-spool-plastic-30m-pink', group: 'addon-spool-plastic-30m', name: '粉線', priceRMB: 59, weight: null, img: '/images/addon/addon-spool-plastic-30m-pink.png', applyMarkup: false },
      // Not a color choice - handled as "text card" variants in
      // AddonUpsellModal rather than color swatches (see isColorVariantGroup()).
      // img only on the def option - used as the group's fixed header photo
      // (same product either way), never shown on the variant cards
      // themselves (see GroupAddonRow's headerImg / non-color-group branch).
      { id: 'addon-flashlight-with-battery', group: 'addon-flashlight', name: '含電池*4', priceRMB: 320, weight: null, def: true, img: '/images/addon/addon-flashlight-with-battery.png', applyMarkup: false },
      { id: 'addon-flashlight-no-battery', group: 'addon-flashlight', name: '不含電池*4', priceRMB: 260, weight: null, applyMarkup: false },
    ],
  },
];
