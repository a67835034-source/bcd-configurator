import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { R2StorageService } from '../storage/r2-storage.service';

export interface ReceiptImageUrls {
  originalContentUrl: string;
  previewImageUrl: string;
}

// The client-captured receipt screenshot (ReceiptCard, ~480px wide but as
// tall as the item list) doesn't fit LINE's image message limits as-is:
// originalContentUrl must be <=1024x1024, previewImageUrl <=240x240, both
// jpeg/png. This resizes (never upscales) to fit inside each box and
// re-encodes as PNG, then uploads both variants to R2.
@Injectable()
export class ReceiptImageService {
  private readonly logger = new Logger(ReceiptImageService.name);

  constructor(private readonly storage: R2StorageService) {}

  async processAndUpload(orderNo: string, buffer: Buffer): Promise<ReceiptImageUrls | null> {
    if (!this.storage.isConfigured) {
      this.logger.warn('Skipped receipt image upload: R2 storage is not configured.');
      return null;
    }

    try {
      const id = randomUUID();
      const [full, thumb] = await Promise.all([
        sharp(buffer).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).png().toBuffer(),
        sharp(buffer).resize({ width: 240, height: 240, fit: 'inside', withoutEnlargement: true }).png().toBuffer(),
      ]);

      const [originalContentUrl, previewImageUrl] = await Promise.all([
        this.storage.upload(`receipts/${orderNo}/${id}-full.png`, full, 'image/png'),
        this.storage.upload(`receipts/${orderNo}/${id}-thumb.png`, thumb, 'image/png'),
      ]);

      return { originalContentUrl, previewImageUrl };
    } catch (err) {
      this.logger.error(`Receipt image processing/upload failed (${orderNo})`, err instanceof Error ? err.stack : String(err));
      return null;
    }
  }
}
