import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { STEP_SEED_DATA } from './seed-data';
import { colorFor } from './seed-color-map';
import { ProductStep } from '../entities/product-step.entity';
import { OptionGroup } from '../entities/option-group.entity';
import { ProductOption } from '../entities/product-option.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { DiscountCode } from '../entities/discount-code.entity';

// Dev/staging seed script: (re)creates the product catalog from
// seed-data.ts and the two pricing settings from the legacy
// EXCHANGE_RATE/MARKUP_MULTIPLIER constants. Run with `npm run seed`
// AFTER `npm run migration:run`.
//
// ⚠️ Destructive: truncates orders/order_items too, so the whole dev DB
// resets to a clean catalog-only state. Never point this at a database
// with real customer orders you want to keep.
async function seed(): Promise<void> {
  await AppDataSource.initialize();

  await AppDataSource.transaction(async (manager) => {
    await manager.query(
      'TRUNCATE TABLE order_items, orders, product_options, option_groups, product_steps, system_settings, discount_codes RESTART IDENTITY CASCADE',
    );

    await manager.save(SystemSetting, [
      {
        settingKey: 'EXCHANGE_RATE',
        settingValue: '4.4',
        valueType: 'number',
        description: '人民幣→台幣約當匯率，請依當日匯率調整',
      },
      {
        settingKey: 'MARKUP_MULTIPLIER',
        settingValue: '1',
        valueType: 'number',
        description: '定價加成倍數，1 = 不加價（僅顯示成本參考價）',
      },
    ]);

    // Example codes for testing the checkout coupon flow - replace/extend
    // as needed once a real promotions process exists.
    await manager.save(DiscountCode, [
      { code: 'WELCOME100', discountType: 'fixed', discountValue: 100 },
      { code: 'SAVE10', discountType: 'percentage', discountValue: 10 },
    ]);

    for (const stepSeed of STEP_SEED_DATA) {
      const step = await manager.save(ProductStep, {
        stepCode: stepSeed.id,
        stepNumber: parseInt(stepSeed.num, 10),
        partKey: stepSeed.part,
        title: stepSeed.title,
        subtitle: stepSeed.sub,
        description: stepSeed.desc,
        note: stepSeed.note ?? null,
        referenceImageUrl: stepSeed.referenceImage ?? null,
        referenceImageCaption: stepSeed.referenceImageCaption ?? null,
      });

      const groupByCode = new Map<string, OptionGroup>();
      if (stepSeed.groups) {
        for (const [index, groupSeed] of stepSeed.groups.entries()) {
          const group = await manager.save(OptionGroup, {
            step,
            groupCode: groupSeed.id,
            label: groupSeed.label,
            specNote: stepSeed.specNote?.[groupSeed.id] ?? null,
            tagline: groupSeed.tagline ?? null,
            recommendation: groupSeed.recommendation ?? null,
            parentLabel: groupSeed.parentLabel ?? null,
            displayOrder: index,
          });
          groupByCode.set(groupSeed.id, group);
        }
      }

      for (const [index, optionSeed] of stepSeed.options.entries()) {
        await manager.save(ProductOption, {
          skuCode: optionSeed.id,
          step,
          group: optionSeed.group ? (groupByCode.get(optionSeed.group) ?? null) : null,
          name: optionSeed.name,
          priceRmb: optionSeed.priceRMB,
          weightKg: optionSeed.weight,
          capacityKg: optionSeed.capacity ?? null,
          hexColor: colorFor(optionSeed.name),
          badgeText: optionSeed.badge ?? null,
          imageUrl: optionSeed.img ?? null,
          swatchImageUrl: optionSeed.swatchImg ?? null,
          isDefault: Boolean(optionSeed.def),
          applyMarkup: optionSeed.applyMarkup ?? true,
          displayOrder: index,
        });
      }
    }
  });

  await AppDataSource.destroy();
  console.log('✔ Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
