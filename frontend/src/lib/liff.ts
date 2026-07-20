import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID;

// Initializes LIFF when the site opens inside LINE's in-app browser (e.g.
// via a rich menu link), so the checkout flow can identify the customer's
// own LINE account without asking them to type anything. Returns the raw
// ID token (a JWT) - never the userId directly, since the userId this
// token decodes to isn't trustworthy until the backend independently
// verifies it against LINE's own /oauth2/v2.1/verify endpoint (see
// backend/src/modules/notifications/line-id-token-verifier.service.ts).
// Resolves to null in any non-LIFF context (desktop browser, LIFF ID not
// configured) - the checkout flow works identically either way, it just
// skips the customer-facing LINE push.
//
// liff.isLoggedIn() only returns true once a LIFF-specific login/consent
// step has completed for THIS liff app - it persists across visits once
// granted (which is why this worked fine in testing: the same developer
// account had already been through it before), but a genuinely new user
// opening the LIFF link for the first time starts out NOT logged in.
//
// liff.login() is only meant for the external-browser case
// (!liff.isInClient()) - when opened from inside LINE's own app,
// authentication is supposed to already be handled automatically during
// liff.init(), and manually calling login() there triggers a native
// redirect that can fail at the WebView level entirely outside JS's
// try/catch (confirmed: this produced a hard "無法正常執行" LINE error
// screen, not a catchable exception, breaking the page). So login() is
// now only attempted outside the LINE client; inside the client, a
// still-false isLoggedIn() after init() indicates the LIFF app's own
// configuration needs checking (scope/endpoint URL), not something this
// code should try to force through a redirect.
export async function initLiff(): Promise<string | null> {
  if (!LIFF_ID) return null;

  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) {
      if (!liff.isInClient()) liff.login();
      return null;
    }
    return liff.getIDToken();
  } catch {
    return null;
  }
}
