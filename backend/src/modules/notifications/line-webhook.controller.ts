import { createHmac, timingSafeEqual } from 'crypto';
import { BadRequestException, Controller, Headers, Logger, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface LineWebhookEvent {
  type: string;
  source: { type: string; userId?: string };
}

/**
 * One-time setup utility, not part of the order flow: LINE never exposes a
 * "message someone by their LINE ID" API - to push messages you need their
 * internal userId, which only appears in webhook events after they've added
 * your Official Account as a friend. Point your channel's webhook URL at
 * POST /api/line/webhook, have the instructor add + message the OA once,
 * read the userId out of the server log, then put it in LINE_ADMIN_USER_ID
 * and this endpoint is no longer needed on the request path.
 *
 * Every request is signature-verified against LINE_CHANNEL_SECRET so this
 * public POST endpoint can't be spoofed - see main.ts for the rawBody: true
 * bootstrap option this depends on.
 */
@Controller('api/line/webhook')
export class LineWebhookController {
  private readonly logger = new Logger(LineWebhookController.name);
  private readonly channelSecret?: string;

  constructor(private readonly config: ConfigService) {
    this.channelSecret = this.config.get<string>('LINE_CHANNEL_SECRET');
  }

  @Post()
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-line-signature') signature: string,
  ): { ok: true } {
    const rawBody = req.rawBody;
    if (!this.channelSecret || !signature || !rawBody || !this.isValidSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid LINE signature');
    }

    const body = JSON.parse(rawBody.toString('utf8')) as { events: LineWebhookEvent[] };
    for (const event of body.events ?? []) {
      if (event.source?.userId) {
        this.logger.log(`LINE event "${event.type}" from userId=${event.source.userId}`);
      }
    }
    return { ok: true };
  }

  private isValidSignature(rawBody: Buffer, signature: string): boolean {
    const expected = createHmac('sha256', this.channelSecret as string).update(rawBody).digest('base64');
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);
    return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
  }
}
