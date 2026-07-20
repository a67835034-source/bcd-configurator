import { DiscountType } from '../../../entities/discount-code.entity';

export interface DiscountPreviewDto {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  subtotalTwd: number;
  discountAmountTwd: number;
  totalTwd: number;
}
