import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 is S3-API-compatible, so the AWS SDK's S3Client works
// unmodified against it - only the endpoint (the account's R2 URL) differs
// from real AWS. The bucket must have public read access (R2.dev subdomain
// or a custom domain) since LINE's servers fetch image URLs asynchronously,
// after the push call already returned - see ReceiptImageService.
@Injectable()
export class R2StorageService {
  private readonly client: S3Client | null;
  private readonly bucket?: string;
  private readonly publicBaseUrl?: string;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = config.get<string>('R2_BUCKET_NAME');
    this.publicBaseUrl = config.get<string>('R2_PUBLIC_BASE_URL');

    this.client =
      accountId && accessKeyId && secretAccessKey
        ? new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  get isConfigured(): boolean {
    return Boolean(this.client && this.bucket && this.publicBaseUrl);
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!this.client || !this.bucket || !this.publicBaseUrl) {
      throw new Error(
        'R2 storage is not configured (need R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL)',
      );
    }
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }
}
