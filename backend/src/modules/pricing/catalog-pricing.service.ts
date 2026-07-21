import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppSettingsService } from '../settings/settings.service';
import { computeTwdPrice } from '../../common/pricing';
import { ProductOption } from '../../entities/product-option.entity';

export interface CartItemInput {
  optionSku: string;
  quantity: number;
}

export interface PricedItem {
  option: ProductOption;
  quantity: number;
  unitPriceRmb: number;
  unitPriceTwd: number;
  lineTotalTwd: number;
}

export interface PricedCart {
  items: PricedItem[];
  subtotalTwd: number;
  totalWeightKg: number;
  exchangeRate: number;
  markupMultiplier: number;
}

/**
 * Re-prices a cart of {optionSku, quantity} from the database - shared by
 * POST /api/orders and POST /api/discount-codes/validate so both trust the
 * same server-side numbers instead of duplicating (and risking drifting)
 * the same re-fetch/re-price logic in two places.
 */
@Injectable()
export class CatalogPricingService {
  constructor(
    private readonly settingsService: AppSettingsService,
    @InjectRepository(ProductOption)
    private readonly optionsRepo: Repository<ProductOption>,
  ) {}

  async priceCart(items: CartItemInput[]): Promise<PricedCart> {
    const skuCodes = items.map((item) => item.optionSku);
    if (new Set(skuCodes).size !== skuCodes.length) {
      throw new BadRequestException(
        'Duplicate optionSku entries in items; combine into a single line with a summed quantity.',
      );
    }

    const options = await this.optionsRepo.find({
      where: { skuCode: In(skuCodes), isActive: true },
      relations: { step: true, group: true },
    });

    if (options.length !== skuCodes.length) {
      const foundSkus = new Set(options.map((option) => option.skuCode));
      const missing = skuCodes.filter((sku) => !foundSkus.has(sku));
      throw new BadRequestException(`Unknown or inactive option SKU(s): ${missing.join(', ')}`);
    }
    const optionsBySku = new Map(options.map((option) => [option.skuCode, option]));

    const { exchangeRate, markupMultiplier } = await this.settingsService.getPricingConfig();

    const pricedItems: PricedItem[] = items.map((item) => {
      const option = optionsBySku.get(item.optionSku) as ProductOption;
      const unitPriceRmb = option.priceRmb;
      const unitPriceTwd = computeTwdPrice(unitPriceRmb, exchangeRate, option.applyMarkup ? markupMultiplier : 1);
      return {
        option,
        quantity: item.quantity,
        unitPriceRmb,
        unitPriceTwd,
        lineTotalTwd: unitPriceTwd * item.quantity,
      };
    });

    const subtotalTwd = pricedItems.reduce((sum, item) => sum + item.lineTotalTwd, 0);
    const totalWeightKg = pricedItems.reduce(
      (sum, item) => sum + (item.option.weightKg !== null ? item.option.weightKg * item.quantity : 0),
      0,
    );

    return { items: pricedItems, subtotalTwd, totalWeightKg, exchangeRate, markupMultiplier };
  }
}
