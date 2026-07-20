import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SystemSetting } from '../../entities/system-setting.entity';

export interface PricingConfig {
  exchangeRate: number;
  markupMultiplier: number;
  updatedAt: Date;
}

const EXCHANGE_RATE_KEY = 'EXCHANGE_RATE';
const MARKUP_MULTIPLIER_KEY = 'MARKUP_MULTIPLIER';

/**
 * Replaces the hardcoded EXCHANGE_RATE / MARKUP_MULTIPLIER constants from the
 * legacy frontend. Values live in system_settings so they're editable from an
 * admin UI without a redeploy - see docs/database-design.md §"system_settings".
 */
@Injectable()
export class AppSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingsRepo: Repository<SystemSetting>,
  ) {}

  async getPricingConfig(): Promise<PricingConfig> {
    const rows = await this.settingsRepo.find({
      where: { settingKey: In([EXCHANGE_RATE_KEY, MARKUP_MULTIPLIER_KEY]) },
    });
    const byKey = new Map(rows.map((row) => [row.settingKey, row]));

    const exchangeRateRow = byKey.get(EXCHANGE_RATE_KEY);
    const markupRow = byKey.get(MARKUP_MULTIPLIER_KEY);

    if (!exchangeRateRow || !markupRow) {
      // A missing pricing setting is an operator/seed-data error, not
      // something the caller can fix by retrying - fail loudly as a 500.
      throw new InternalServerErrorException(
        'Required pricing settings (EXCHANGE_RATE / MARKUP_MULTIPLIER) are not configured.',
      );
    }

    const exchangeRate = Number(exchangeRateRow.settingValue);
    const markupMultiplier = Number(markupRow.settingValue);

    if (Number.isNaN(exchangeRate) || Number.isNaN(markupMultiplier)) {
      throw new InternalServerErrorException(
        'Pricing settings contain a non-numeric value; check system_settings.',
      );
    }

    const updatedAt =
      exchangeRateRow.updatedAt > markupRow.updatedAt
        ? exchangeRateRow.updatedAt
        : markupRow.updatedAt;

    return { exchangeRate, markupMultiplier, updatedAt };
  }
}
