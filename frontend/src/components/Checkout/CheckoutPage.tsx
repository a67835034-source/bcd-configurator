import { useEffect, useState } from 'react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { buildOrderItems, computeTotals, getGiftItems, getOrderLineItems } from '../../store/selectors';
import { fmt } from '../../lib/pricing';
import { createOrder, sendEmailVerificationCode, verifyEmailCode, validateDiscountCode, ApiError } from '../../api/client';
import { DiscountPreview } from '../../types';
import OrderSummaryList from './OrderSummaryList';
import GiftItemsList from './GiftItemsList';
import TermsAgreement from './TermsAgreement';

const RESEND_COOLDOWN_SECONDS = 60;

function discountLabel(preview: DiscountPreview): string {
  return preview.discountType === 'percentage' ? `${preview.discountValue}% 折扣` : `NT$${fmt(preview.discountValue)} 折抵`;
}

// The "後續介面" (follow-up screen) requested: a dedicated checkout step
// between the configurator and the final receipt, showing every selected
// option with its photo, a coupon field, and the recalculated total -
// before committing to POST /api/orders.
export default function CheckoutPage() {
  const steps = useConfiguratorStore((s) => s.steps);
  const selections = useConfiguratorStore((s) => s.selections);
  const weightCart = useConfiguratorStore((s) => s.weightCart);
  const addonCart = useConfiguratorStore((s) => s.addonCart);
  const tankB = useConfiguratorStore((s) => s.tankB);
  const weightTargetKg = useConfiguratorStore((s) => s.weightTargetKg);
  const liffIdToken = useConfiguratorStore((s) => s.liffIdToken);
  const goToConfigurator = useConfiguratorStore((s) => s.goToConfigurator);
  const goToConfirmation = useConfiguratorStore((s) => s.goToConfirmation);

  const lineItems = getOrderLineItems(steps, selections, weightCart, addonCart, tankB);
  const { totalTwd: subtotalTwd } = computeTotals(steps, selections, weightCart, addonCart, tankB);
  const items = buildOrderItems(steps, selections, weightCart, addonCart, tankB);
  const gifts = getGiftItems(steps, selections);

  const [customerName, setCustomerName] = useState('');
  const [contactValue, setContactValue] = useState('');

  const [email, setEmail] = useState('');
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [sendCodeError, setSendCodeError] = useState<string | null>(null);
  const [verifyCodeError, setVerifyCodeError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [couponInput, setCouponInput] = useState('');
  const [discountPreview, setDiscountPreview] = useState<DiscountPreview | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const finalTotal = discountPreview ? discountPreview.totalTwd : subtotalTwd;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleEmailChange(value: string) {
    setEmail(value);
    // Editing the email after sending/verifying a code invalidates both -
    // any code already sent was for the old address.
    if (codeSent || emailVerificationToken) {
      setCodeSent(false);
      setCodeInput('');
      setEmailVerificationToken(null);
      setSendCodeError(null);
      setVerifyCodeError(null);
    }
  }

  async function handleSendCode() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setSendingCode(true);
    setSendCodeError(null);
    try {
      await sendEmailVerificationCode({ email: trimmed });
      setCodeSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setSendCodeError(err instanceof ApiError ? err.message : '驗證碼發送失敗，請稍後再試');
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    const trimmedEmail = email.trim();
    const trimmedCode = codeInput.trim();
    if (!trimmedEmail || trimmedCode.length !== 6) return;
    setVerifyingCode(true);
    setVerifyCodeError(null);
    try {
      const res = await verifyEmailCode({ email: trimmedEmail, code: trimmedCode });
      setEmailVerificationToken(res.token);
    } catch (err) {
      setVerifyCodeError(err instanceof ApiError ? err.message : '驗證失敗，請確認驗證碼是否正確');
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponChecking(true);
    setCouponError(null);
    try {
      const preview = await validateDiscountCode({ code, items });
      setDiscountPreview(preview);
    } catch (err) {
      setDiscountPreview(null);
      setCouponError(err instanceof ApiError ? err.message : '折扣碼驗證失敗');
    } finally {
      setCouponChecking(false);
    }
  }

  function handleRemoveCoupon() {
    setDiscountPreview(null);
    setCouponInput('');
    setCouponError(null);
  }

  const canSubmit =
    customerName.trim() !== '' &&
    contactValue.trim() !== '' &&
    Boolean(emailVerificationToken) &&
    lineItems.length > 0 &&
    agreedToTerms;

  async function handleSubmit() {
    if (!emailVerificationToken) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder({
        items,
        customerName: customerName.trim(),
        contactChannel: 'line',
        contactValue: contactValue.trim(),
        customerEmail: email.trim(),
        emailVerificationToken,
        weightTargetKg: weightTargetKg ?? undefined,
        discountCode: discountPreview?.code,
        liffIdToken: liffIdToken ?? undefined,
      });
      goToConfirmation(order, { customerName: customerName.trim(), contactValue: contactValue.trim() });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : '送出訂單失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[720px] pb-16">
      <button
        type="button"
        onClick={goToConfigurator}
        className="mb-5 inline-flex items-center gap-2 rounded-sm border border-line px-4 py-2.5 text-[15px] font-medium text-ink transition-colors hover:border-teal hover:text-teal"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        返回調整配置
      </button>

      <h1 className="mb-1 font-display text-2xl uppercase tracking-wide">確認訂單</h1>
      <p className="mb-6 text-[13px] text-ink-dim">請確認您的選擇，並可於下方輸入折價券。</p>

      <section className="mb-6">
        <h2 className="mb-2.5 font-mono text-[11px] uppercase tracking-wide text-teal">您的選擇（共 {lineItems.length} 項）</h2>
        <OrderSummaryList lineItems={lineItems} />
      </section>

      {gifts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2.5 font-mono text-[11px] uppercase tracking-wide text-teal">附贈項目</h2>
          <GiftItemsList gifts={gifts} />
        </section>
      )}

      <section className="mb-6 rounded-sm border border-line bg-panel p-4">
        <h2 className="mb-2.5 font-mono text-[11px] uppercase tracking-wide text-teal">折價券</h2>
        {discountPreview ? (
          <div className="flex items-center justify-between rounded-sm border border-ok/40 bg-ok/10 px-3 py-2.5 text-sm">
            <span>
              已套用 <strong className="font-mono">{discountPreview.code}</strong>（{discountLabel(discountPreview)}）
            </span>
            <button type="button" onClick={handleRemoveCoupon} className="text-xs text-ink-dim underline hover:text-signal">
              移除
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              placeholder="輸入折扣碼"
              className="flex-1 rounded-sm border border-line bg-white px-3 py-2.5 text-[13px] uppercase tracking-wide text-ink focus:border-teal focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponChecking || !couponInput.trim()}
              className="rounded-sm border border-teal bg-teal px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {couponChecking ? '驗證中…' : '套用'}
            </button>
          </div>
        )}
        {couponError && <div className="mt-2 text-xs text-signal">{couponError}</div>}
      </section>

      <section className="mb-6 rounded-sm border border-line bg-panel p-4">
        <h2 className="mb-2.5 font-mono text-[11px] uppercase tracking-wide text-teal">聯絡資訊</h2>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="姓名"
            required
            className="flex-1 rounded-sm border border-line bg-white px-3 py-2.5 text-[13px] text-ink focus:border-teal focus:outline-none"
          />
          <input
            type="text"
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            placeholder="LINE ID／電話"
            required
            className="flex-1 rounded-sm border border-line bg-white px-3 py-2.5 text-[13px] text-ink focus:border-teal focus:outline-none"
          />
        </div>

        <div className="mt-3">
          {emailVerificationToken ? (
            <div className="flex items-center justify-between rounded-sm border border-ok/40 bg-ok/10 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-1.5 text-ink">
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ok text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-2.5 w-2.5">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {email}（已驗證）
              </span>
              <button
                type="button"
                onClick={() => handleEmailChange('')}
                className="text-xs text-ink-dim underline hover:text-signal"
              >
                更改
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="電子郵件"
                  required
                  className="flex-1 rounded-sm border border-line bg-white px-3 py-2.5 text-[13px] text-ink focus:border-teal focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || !email.trim() || resendCooldown > 0}
                  className="whitespace-nowrap rounded-sm border border-teal bg-teal px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingCode ? '發送中…' : resendCooldown > 0 ? `重新發送（${resendCooldown}s）` : codeSent ? '重新發送' : '發送驗證碼'}
                </button>
              </div>
              {sendCodeError && <div className="mt-2 text-xs text-signal">{sendCodeError}</div>}

              {codeSent && (
                <div className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                    placeholder="請輸入 6 位數驗證碼"
                    className="flex-1 rounded-sm border border-line bg-white px-3 py-2.5 text-[13px] tracking-widest text-ink focus:border-teal focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={verifyingCode || codeInput.length !== 6}
                    className="whitespace-nowrap rounded-sm border border-signal bg-signal px-4 py-2.5 text-[13px] font-semibold text-[#1a0e08] hover:bg-[#ff7d54] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {verifyingCode ? '驗證中…' : '驗證'}
                  </button>
                </div>
              )}
              {verifyCodeError && <div className="mt-2 text-xs text-signal">{verifyCodeError}</div>}
            </>
          )}
        </div>
      </section>

      <div className="mb-6">
        <span className="inline-flex items-start gap-1.5 rounded-sm border border-signal/30 bg-signal/5 py-1.5 pl-1.5 pr-2.5 text-[13px]">
          <span className="mt-0.5 flex-shrink-0 rounded-full bg-signal px-1.5 py-0.5 text-[10px] font-bold text-white">附贈</span>
          <span className="font-medium text-ink">本產品僅以面交方式交貨，並於當日進行「Fundive－裝備調校」，免費下水 1 潛</span>
        </span>
      </div>

      <section className="rounded-sm border border-line bg-panel p-4">
        <div className="flex justify-between text-[13px] text-ink-dim">
          <span>小計</span>
          <span className="font-mono">NT${fmt(subtotalTwd)}</span>
        </div>
        {discountPreview && (
          <div className="mt-1.5 flex justify-between text-[13px] text-signal">
            <span>折扣（{discountPreview.code}）</span>
            <span className="font-mono">-NT${fmt(discountPreview.discountAmountTwd)}</span>
          </div>
        )}
        <div className="mt-2.5 flex items-baseline justify-between border-t border-line pt-2.5">
          <span className="font-semibold text-ink">總計</span>
          <span className="font-mono text-2xl font-bold text-ink">NT${fmt(finalTotal)}</span>
        </div>
      </section>

      <TermsAgreement agreed={agreedToTerms} onChange={setAgreedToTerms} />

      {submitError && <div className="mt-3 text-sm text-signal">{submitError}</div>}
      {!canSubmit && (
        <div className="mt-3 text-xs text-ink-dim">
          請填寫姓名、LINE ID／電話，完成電子郵件驗證，並詳閱並同意服務條款後才能送出訂單。
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !canSubmit}
        className="mt-4 w-full rounded-sm border border-signal bg-signal py-3.5 text-[14px] font-semibold text-[#1a0e08] hover:bg-[#ff7d54] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? '送出中…' : '確認送出訂單'}
      </button>
    </div>
  );
}
