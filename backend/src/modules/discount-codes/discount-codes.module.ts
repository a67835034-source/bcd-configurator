import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountCode } from '../../entities/discount-code.entity';
import { PricingModule } from '../pricing/pricing.module';
import { DiscountCodesController } from './discount-codes.controller';
import { DiscountCodesService } from './discount-codes.service';

@Module({
  imports: [TypeOrmModule.forFeature([DiscountCode]), PricingModule],
  controllers: [DiscountCodesController],
  providers: [DiscountCodesService],
  exports: [DiscountCodesService],
})
export class DiscountCodesModule {}
