import { Controller, Get } from '@nestjs/common';
import { AppSettingsService, PricingConfig } from './settings.service';

@Controller('api/config')
export class SettingsController {
  constructor(private readonly settingsService: AppSettingsService) {}

  // GET /api/config -> { exchangeRate, markupMultiplier, updatedAt }
  @Get()
  async getConfig(): Promise<PricingConfig> {
    return this.settingsService.getPricingConfig();
  }
}
