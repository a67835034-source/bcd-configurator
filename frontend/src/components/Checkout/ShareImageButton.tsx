import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ReceiptCard, { ReceiptCardProps } from './ReceiptCard';
import { attachReceiptImage } from '../../api/client';
import { resolveLineItemImages } from '../../lib/imageDataUrl';
import { OrderLineItem } from '../../store/selectors';

interface ShareImageButtonProps extends ReceiptCardProps {
  orderId: number;
}

// Switched from html-to-image to html2canvas: html-to-image serializes the
// whole DOM (with every image embedded) into one big SVG string, then loads
// THAT as a single SVG image to rasterize onto a canvas - WebKit-based
// browsers (LINE's in-app browser on iOS is WKWebView, i.e. Safari's
// engine) have a known reliability issue rendering large embedded raster
// images inside an SVG foreignObject, independent of whether the image was
// already fully loaded beforehand. That's why waiting longer and even
// pre-converting images to base64 (still done below, it's still a good
// idea) made no difference - the failure was happening inside html-to-
// image's SVG rasterization step itself, not in image loading. html2canvas
// walks the DOM and paints each element directly onto a canvas via
// drawImage(), with no SVG serialization step to hit this bug.
async function captureToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, allowTaint: false });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// html2canvas also just reads each <img>'s current bitmap - if it isn't
// decoded yet, that draws blank. Retries decode() on failure instead of
// giving up after one attempt, bounded by `timeoutMs`. Kept as a defense-
// in-depth safety net even though the real fix is resolveLineItemImages()
// below - by the time this runs, every option photo's src is already a
// base64 data: URI (no network fetch left to wait on), so this should now
// resolve on the very first decode() call.
function waitForImages(container: HTMLElement, timeoutMs = 8000): Promise<void[]> {
  const imgs = Array.from(container.querySelectorAll('img'));
  const deadline = Date.now() + timeoutMs;

  async function waitOne(img: HTMLImageElement): Promise<void> {
    while (Date.now() < deadline) {
      if (!img.src) return;
      try {
        await img.decode();
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }

  return Promise.all(imgs.map(waitOne));
}

// If a custom web font (this project loads Oswald/Inter/JetBrains Mono from
// Google Fonts - see index.html) hasn't finished loading yet, the browser
// silently paints with a fallback font instead, which has different
// character widths - shifting text position/alignment in exactly the way
// that's otherwise invisible on-screen (the page just re-flows once the
// font swaps in) but gets baked permanently into a canvas capture taken too
// early. document.fonts.ready resolves once every currently-loading font
// has settled.
function waitForFonts(): Promise<void> {
  return document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
}

// "跳出一個圖片視窗...並有一個下載按鈕" - renders ReceiptCard off-screen
// (always mounted so html2canvas has real, laid-out DOM with images
// already loaded to read), captures it to a PNG on click, then shows that
// PNG in a modal with a download button.
export default function ShareImageButton({ orderId, ...props }: ShareImageButtonProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Every option.img/swatchImg is pre-converted to a base64 data: URI
  // before ReceiptCard ever renders it, so the <img> tags html2canvas
  // reads never need a live network fetch during capture at all - this
  // sidesteps LINE's in-app WebView entirely (no CORS check, no off-screen
  // network de-prioritization, nothing to race against), rather than
  // hoping the fetch finishes in time. `resolvingRef` lets handleGenerate
  // await the exact same in-flight resolution instead of relying on render
  // timing.
  const [resolvedLineItems, setResolvedLineItems] = useState<OrderLineItem[] | null>(null);
  const resolvingRef = useRef<Promise<OrderLineItem[]> | null>(null);

  useEffect(() => {
    const promise = resolveLineItemImages(props.lineItems);
    resolvingRef.current = promise;
    let cancelled = false;
    promise.then((resolved) => {
      if (!cancelled) setResolvedLineItems(resolved);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.lineItems]);

  // Auto-captures the same receipt image the customer can choose to
  // download, and silently forwards it to the backend once so the
  // instructor's LINE push gets a visual copy - independent of whether the
  // customer ever clicks "產生訂單圖片" themselves. Best-effort: any failure
  // here is purely a missed notification, never something the customer
  // should see.
  useEffect(() => {
    if (!resolvedLineItems) return; // wait for base64 conversion to land in the DOM first
    let cancelled = false;
    (async () => {
      if (!receiptRef.current) return;
      try {
        await Promise.all([waitForImages(receiptRef.current), waitForFonts()]);
        if (cancelled || !receiptRef.current) return;
        const canvas = await captureToCanvas(receiptRef.current);
        if (cancelled) return;
        const blob = await canvasToBlob(canvas);
        if (blob && !cancelled) await attachReceiptImage(orderId, blob);
      } catch {
        // ignored - background notification only
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, resolvedLineItems]);

  async function handleGenerate() {
    setShowModal(true);
    setGenerating(true);
    setError(null);
    setImageUrl(null);
    try {
      // Wait for the same base64 resolution the auto-upload path uses,
      // then a paint tick so React has actually committed those srcs to
      // the DOM before capture reads it.
      if (resolvingRef.current) await resolvingRef.current;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!receiptRef.current) throw new Error('receipt node not mounted');
      await Promise.all([waitForImages(receiptRef.current), waitForFonts()]);
      const canvas = await captureToCanvas(receiptRef.current);
      setImageUrl(canvas.toDataURL('image/png'));
    } catch {
      setError('圖片產生失敗，請稍後再試');
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${props.orderNo}-規格單.png`;
    link.click();
  }

  return (
    <>
      {/* opacity:0 + z-index:-1 instead of pushing it far off-screen
          (left: -9999px) - some mobile WebViews de-prioritize network
          loading for elements positioned outside the viewport. Largely
          moot now that images are pre-resolved to base64 before render,
          but kept as it's still a more correct way to hide the node. */}
      <div style={{ position: 'fixed', left: 0, top: 0, opacity: 0, zIndex: -1, pointerEvents: 'none' }} aria-hidden="true">
        <ReceiptCard ref={receiptRef} {...props} lineItems={resolvedLineItems ?? props.lineItems} />
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        className="w-full rounded-sm border border-line px-4 py-3 text-[13.5px] font-semibold text-ink hover:border-teal"
      >
        產生訂單圖片（可下載）
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-md bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base uppercase tracking-wide">訂單規格圖片</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-dim hover:bg-panel-raised hover:text-signal"
              >
                ✕
              </button>
            </div>

            {generating && <div className="py-16 text-center text-sm text-ink-dim">產生圖片中…</div>}
            {error && <div className="py-6 text-center text-sm text-signal">{error}</div>}
            {imageUrl && !generating && (
              <>
                <img src={imageUrl} alt="訂單規格圖片" className="w-full rounded-sm border border-line" />
                <button
                  type="button"
                  onClick={handleDownload}
                  className="mt-4 w-full rounded-sm border border-signal bg-signal py-3 text-[13.5px] font-semibold text-[#1a0e08] hover:bg-[#ff7d54]"
                >
                  下載圖片
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
