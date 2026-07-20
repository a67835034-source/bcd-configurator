import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DiscountCode } from '../../entities/discount-code.entity';

@Injectable()
export class DiscountCodesService {
  constructor(
    @InjectRepository(DiscountCode)
    private readonly discountCodesRepo: Repository<DiscountCode>,
  ) {}

  // Pass `manager` when called inside an order-creation transaction, so the
  // re-check (max-uses etc.) and the later incrementUsage() see a
  // consistent, lockable view of the row rather than a separate connection.
  async findValidCode(rawCode: string, manager?: EntityManager): Promise<DiscountCode> {
    const code = rawCode.trim().toUpperCase();
    const repo = manager ? manager.getRepository(DiscountCode) : this.discountCodesRepo;
    const discountCode = await repo.findOne({ where: { code } });

    if (!discountCode) {
      throw new NotFoundException(`折扣碼「${rawCode}」不存在`);
    }
    if (!discountCode.isActive) {
      throw new BadRequestException(`折扣碼「${rawCode}」已停用`);
    }
    if (discountCode.expiresAt && discountCode.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(`折扣碼「${rawCode}」已過期`);
    }
    if (discountCode.maxUses !== null && discountCode.usedCount >= discountCode.maxUses) {
      throw new BadRequestException(`折扣碼「${rawCode}」已達使用上限`);
    }

    return discountCode;
  }

  // percentage: rounded to the nearest dollar. fixed: capped at the
  // subtotal so a coupon can never make the total negative.
  computeDiscountAmount(discountCode: DiscountCode, subtotalTwd: number): number {
    if (discountCode.discountType === 'percentage') {
      return Math.round(subtotalTwd * (discountCode.discountValue / 100));
    }
    return Math.min(discountCode.discountValue, subtotalTwd);
  }

  async incrementUsage(discountCodeId: number, manager: EntityManager): Promise<void> {
    await manager.increment(DiscountCode, { id: discountCodeId }, 'usedCount', 1);
  }
}
