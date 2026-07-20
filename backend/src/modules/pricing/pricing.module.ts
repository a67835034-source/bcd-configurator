import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOption } from '../../entities/product-option.entity';
import { SettingsModule } from '../settings/settings.module';
import { CatalogPricingService } from './catalog-pricing.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOption]), SettingsModule],
  providers: [CatalogPricingService],
  exports: [CatalogPricingService],
})
export class PricingModule {}
