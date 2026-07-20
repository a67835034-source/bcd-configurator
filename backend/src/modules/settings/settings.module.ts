import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from '../../entities/system-setting.entity';
import { SettingsController } from './settings.controller';
import { AppSettingsService } from './settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting])],
  controllers: [SettingsController],
  providers: [AppSettingsService],
  // exported so OrdersModule can read the current exchange rate/markup
  // when pricing an order
  exports: [AppSettingsService],
})
export class SettingsModule {}
