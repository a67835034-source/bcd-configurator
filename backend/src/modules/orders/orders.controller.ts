import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import sharp from 'sharp';
import { OrdersService } from './orders.service';
import { LineNotifyService } from '../notifications/line-notify.service';
import { ReceiptImageService } from '../notifications/receipt-image.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

const MAX_RECEIPT_IMAGE_BYTES = 3 * 1024 * 1024;

@Controller('api/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly lineNotifyService: LineNotifyService,
    private readonly receiptImageService: ReceiptImageService,
  ) {}

  // TEMPORARY diagnostic route - visit in a browser to confirm
  // LINE_CHANNEL_ACCESS_TOKEN / LINE_ADMIN_USER_ID are configured correctly
  // before wiring up R2. Remove once confirmed working.
  @Get('test-line')
  async testLine(): Promise<{ ok: boolean; error?: string }> {
    return this.lineNotifyService.sendTextMessage('測試成功！你的 NestJS 後端已經成功連上 LINE API 了！');
  }

  // TEMPORARY diagnostic route - generates a small solid-color PNG and runs
  // it through the exact same resize+upload path a real receipt image
  // takes (ReceiptImageService.processAndUpload), to confirm the R2_* env
  // vars are correct before wiring up the full checkout flow. Visit the
  // returned originalContentUrl in a browser to confirm it's publicly
  // reachable. Remove once confirmed working.
  @Get('test-r2')
  async testR2(): Promise<{ ok: boolean; originalContentUrl?: string; previewImageUrl?: string; error?: string }> {
    const buffer = await sharp({
      create: { width: 400, height: 300, channels: 4, background: { r: 28, g: 127, b: 140, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const urls = await this.receiptImageService.processAndUpload('test-r2', buffer);
    if (!urls) {
      return { ok: false, error: 'R2 upload failed or R2_* env vars are not configured - check backend logs' };
    }
    return { ok: true, ...urls };
  }

  // POST /api/orders -> 201 + { orderId, orderNo, status, totalPriceTwd, totalWeightKg, itemCount }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(dto);
  }

  // POST /api/orders/:orderId/receipt-image -> 202, fire-and-forget
  // Called by the confirmation screen right after an order is created, with
  // the client-captured receipt PNG (see frontend ShareImageButton) - kept
  // as its own request rather than bundled into createOrder() because the
  // image is only generated once the real orderNo (baked into the receipt)
  // already exists.
  @Post(':orderId/receipt-image')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('receiptImage', { storage: memoryStorage(), limits: { fileSize: MAX_RECEIPT_IMAGE_BYTES } }))
  async attachReceiptImage(
    @Param('orderId', ParseIntPipe) orderId: number,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ ok: true }> {
    if (!file) {
      throw new BadRequestException('receiptImage file is required');
    }
    await this.ordersService.attachReceiptImage(orderId, file.buffer, file.mimetype);
    return { ok: true };
  }
}
