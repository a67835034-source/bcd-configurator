// Mirrors backend/src/modules/products/dto/step-response.dto.ts field-for-field
// (which in turn mirrors the legacy STEPS array in 0711檔案.html).

export interface StepGroup {
  id: string;
  label: string;
  tagline?: string; // short buyer-guidance label, e.g. "輕便優先"
  recommendation?: string; // one-sentence "who this is for"
  parentLabel?: string; // groups sharing this collapse into one tab, e.g. STA's 3 alu specs -> "鋁板"
}

export interface StepOption {
  id: string; // sku_code
  group?: string;
  name: string;
  priceRMB: number;
  weight: number | null;
  capacity?: number;
  badge?: string;
  def?: boolean;
  img?: string; // full product photo -> large tile (e.g. tank band)
  swatchImg?: string; // cropped fabric/pattern texture -> small chip (e.g. leopard/floral)
}

export interface Step {
  id: string;
  num: string;
  part: string;
  title: string;
  sub?: string;
  desc?: string;
  note?: string; // short disclaimer near the title
  referenceImage?: string; // illustrative photo shown alongside the option grid
  referenceImageCaption?: string;
  groups?: StepGroup[];
  specNote?: Record<string, string>;
  options: StepOption[];
}

// Mirrors backend GET /api/config response
export interface PricingConfig {
  exchangeRate: number;
  markupMultiplier: number;
  updatedAt: string;
}

// Mirrors backend POST /api/orders request body (CreateOrderDto)
export interface CreateOrderItemPayload {
  optionSku: string;
  quantity: number;
}

export interface CreateOrderPayload {
  // 聯絡資訊改為必填 - required both here and by the backend's CreateOrderDto.
  customerName: string;
  contactChannel?: 'line' | 'phone' | 'email';
  contactValue: string;
  customerEmail: string;
  // From POST /api/email-verification/verify - the backend independently
  // re-checks this against EmailVerificationService rather than trusting a
  // client-side "verified" flag.
  emailVerificationToken: string;
  weightTargetKg?: number;
  notes?: string;
  discountCode?: string;
  // Raw LIFF ID token (see lib/liff.ts) - the backend independently verifies
  // this against LINE's own servers before trusting the userId it decodes
  // to, so it's never sent as a plain claimed userId.
  liffIdToken?: string;
  items: CreateOrderItemPayload[];
}

export interface SendEmailCodePayload {
  email: string;
}

export interface VerifyEmailCodePayload {
  email: string;
  code: string;
}

export interface VerifyEmailCodeResponse {
  verified: true;
  token: string;
}

// Mirrors backend POST /api/orders response (OrderResponseDto)
export interface OrderResponse {
  orderId: number;
  orderNo: string;
  status: string;
  subtotalPriceTwd: number;
  discountCode?: string;
  discountAmountTwd: number;
  totalPriceTwd: number;
  totalWeightKg: number;
  itemCount: number;
}

// Mirrors backend POST /api/discount-codes/validate request/response
export interface ValidateDiscountCodePayload {
  code: string;
  items: CreateOrderItemPayload[];
}

export interface DiscountPreview {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  subtotalTwd: number;
  discountAmountTwd: number;
  totalTwd: number;
}
