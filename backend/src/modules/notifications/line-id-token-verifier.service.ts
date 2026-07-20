import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const LINE_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';

// Verifies a LIFF ID token server-side rather than trusting whatever userId
// the client claims - this userId is later used to push remittance info and
// the receipt image directly to a customer's own LINE account, so it must
// be independently confirmed to actually belong to whoever is holding this
// session, not just read out of an unverified JWT payload client-side.
// Requires LINE_LIFF_CHANNEL_ID (the LINE Login channel the LIFF app
// belongs to - matches the token's `aud` claim).
@Injectable()
export class LineIdTokenVerifierService {
  private readonly logger = new Logger(LineIdTokenVerifierService.name);
  private readonly liffChannelId?: string;

  constructor(config: ConfigService) {
    this.liffChannelId = config.get<string>('LINE_LIFF_CHANNEL_ID');
  }

  async verify(idToken: string): Promise<string | null> {
    if (!this.liffChannelId) {
      this.logger.warn('Skipped LIFF ID token verification: LINE_LIFF_CHANNEL_ID not configured.');
      return null;
    }

    try {
      const res = await fetch(LINE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_token: idToken, client_id: this.liffChannelId }),
      });

      if (!res.ok) {
        this.logger.warn(`LIFF ID token verification rejected (${res.status}): ${await res.text()}`);
        return null;
      }

      const payload = (await res.json()) as { sub?: string };
      return payload.sub ?? null;
    } catch (err) {
      this.logger.error('LIFF ID token verification threw', err instanceof Error ? err.stack : String(err));
      return null;
    }
  }
}
