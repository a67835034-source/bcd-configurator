import { OrderStatus } from '../../../entities/order.entity';

export interface OrderResponseDto {
  orderId: number;
  orderNo: string;
  status: OrderStatus;
  subtotalPriceTwd: number;
  discountCode?: string;
  discountAmountTwd: number;
  totalPriceTwd: number;
  totalWeightKg: number;
  itemCount: number;
}
