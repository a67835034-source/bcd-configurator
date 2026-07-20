import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { LineNotifyService } from './line-notify.service';
import { ReceiptImageService } from './receipt-image.service';
import { LineIdTokenVerifierService } from './line-id-token-verifier.service';
import { LineWebhookController } from './line-webhook.controller';

@Module({
  imports: [StorageModule],
  controllers: [LineWebhookController],
  providers: [LineNotifyService, ReceiptImageService, LineIdTokenVerifierService],
  exports: [LineNotifyService, ReceiptImageService, LineIdTokenVerifierService],
})
export class NotificationsModule {}
