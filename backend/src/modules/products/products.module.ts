import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductStep } from '../../entities/product-step.entity';
import { OptionGroup } from '../../entities/option-group.entity';
import { ProductOption } from '../../entities/product-option.entity';
import { SettingsModule } from '../settings/settings.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductStep, OptionGroup, ProductOption]), SettingsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
