import { Body, Controller, Post } from '@nestjs/common';
import { DiscountCodesService } from './discount-codes.service';
import { CatalogPricingService } from '../pricing/catalog-pricing.service';
import { ValidateDiscountCodeDto } from './dto/validate-discount-code.dto';
import { DiscountPreviewDto } from './dto/discount-preview.dto';

@Controller('api/discount-codes')
export class DiscountCodesController {
  constructor(
    private readonly discountCodesService: DiscountCodesService,
    private readonly catalogPricingService: CatalogPricingService,
  ) {}

  // POST /api/discount-codes/validate -> live preview shown on the checkout
  // page before the customer submits the order. The same code is
  // re-validated (and its usage counted) again at POST /api/orders time -
  // this endpoint never mutates anything, it's read-only.
  @Post('validate')
  async validate(@Body() dto: ValidateDiscountCodeDto): Promise<DiscountPreviewDto> {
    const { subtotalTwd } = await this.catalogPricingService.priceCart(dto.items);
    const discountCode = await this.discountCodesService.findValidCode(dto.code);
    const discountAmountTwd = this.discountCodesService.computeDiscountAmount(discountCode, subtotalTwd);

    return {
      code: discountCode.code,
      discountType: discountCode.discountType,
      discountValue: discountCode.discountValue,
      subtotalTwd,
      discountAmountTwd,
      totalTwd: subtotalTwd - discountAmountTwd,
    };
  }
}
