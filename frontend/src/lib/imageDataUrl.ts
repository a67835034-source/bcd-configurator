import { OrderLineItem } from '../store/selectors';

const cache = new Map<string, Promise<string>>();

// Converts an image URL to a base64 data: URI so a captured <img> never
// needs a live network fetch during the capture pass (see ShareImageButton) -
// sidesteps WebView-specific quirks around CORS and off-screen network
// prioritization entirely, since data: URIs require no fetch and are never
// cross-origin. Cached per URL - checkout can trigger this repeatedly (the
// automatic background upload, then a manual "產生訂單圖片" click) for the
// same photos.
export function toDataUrl(url: string): Promise<string> {
  let cached = cache.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error(`failed to read blob for ${url}`));
            reader.readAsDataURL(blob);
          }),
      );
    cache.set(url, cached);
  }
  return cached;
}

// Resolves every option.img/swatchImg referenced by a set of order line
// items to base64, returning a new array (line items are otherwise treated
// as immutable elsewhere) with those two fields swapped in place. Falls
// back to the original URL for any image that fails to convert (network
// error, 404) rather than dropping the whole capture over one bad photo.
export async function resolveLineItemImages(lineItems: OrderLineItem[]): Promise<OrderLineItem[]> {
  return Promise.all(
    lineItems.map(async (line) => {
      const [img, swatchImg] = await Promise.all([
        line.option.img ? toDataUrl(line.option.img).catch(() => line.option.img) : Promise.resolve(line.option.img),
        line.option.swatchImg
          ? toDataUrl(line.option.swatchImg).catch(() => line.option.swatchImg)
          : Promise.resolve(line.option.swatchImg),
      ]);
      return { ...line, option: { ...line.option, img, swatchImg } };
    }),
  );
}
