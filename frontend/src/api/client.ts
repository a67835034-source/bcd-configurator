import {
  CreateOrderPayload,
  DiscountPreview,
  OrderResponse,
  SendEmailCodePayload,
  Step,
  ValidateDiscountCodePayload,
  VerifyEmailCodePayload,
  VerifyEmailCodeResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join('; ') : (body?.message ?? res.statusText);
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export function getProducts(): Promise<Step[]> {
  return request<Step[]>('/api/products');
}

export function createOrder(payload: CreateOrderPayload): Promise<OrderResponse> {
  return request<OrderResponse>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function validateDiscountCode(payload: ValidateDiscountCodePayload): Promise<DiscountPreview> {
  return request<DiscountPreview>('/api/discount-codes/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function sendEmailVerificationCode(payload: SendEmailCodePayload): Promise<{ ok: true }> {
  return request<{ ok: true }>('/api/email-verification/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function verifyEmailCode(payload: VerifyEmailCodePayload): Promise<VerifyEmailCodeResponse> {
  return request<VerifyEmailCodeResponse>('/api/email-verification/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Multipart, not JSON+base64 - bypasses request()'s forced Content-Type:
// application/json since the browser must set its own multipart boundary.
// Best-effort background call (see ShareImageButton) - failures here should
// never surface to the customer, so callers are expected to catch/ignore.
export async function attachReceiptImage(orderId: number, image: Blob): Promise<void> {
  const formData = new FormData();
  formData.append('receiptImage', image, 'receipt.png');
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/receipt-image`, { method: 'POST', body: formData });
  if (!res.ok) {
    throw new ApiError('receipt image upload failed', res.status);
  }
}
