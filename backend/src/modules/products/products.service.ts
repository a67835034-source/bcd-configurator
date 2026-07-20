import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStep } from '../../entities/product-step.entity';
import { ProductOption } from '../../entities/product-option.entity';
import { OptionResponseDto, StepResponseDto } from './dto/step-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductStep)
    private readonly stepsRepo: Repository<ProductStep>,
  ) {}

  async getAllSteps(): Promise<StepResponseDto[]> {
    const steps = await this.stepsRepo.find({
      where: { isActive: true },
      // options.group is loaded too, so each option DTO can report which
      // group it belongs to (e.g. "18" / "25" / "30") without an N+1 query.
      relations: { groups: true, options: { group: true } },
      order: { stepNumber: 'ASC' },
    });

    return steps.map((step) => this.toStepDto(step));
  }

  private toStepDto(step: ProductStep): StepResponseDto {
    const activeGroups = (step.groups ?? [])
      .filter((group) => group.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const activeOptions = (step.options ?? [])
      .filter((option) => option.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const dto: StepResponseDto = {
      id: step.stepCode,
      num: String(step.stepNumber).padStart(2, '0'),
      part: step.partKey,
      title: step.title,
      sub: step.subtitle ?? undefined,
      desc: step.description ?? undefined,
      note: step.note ?? undefined,
      referenceImage: step.referenceImageUrl ?? undefined,
      referenceImageCaption: step.referenceImageCaption ?? undefined,
      options: activeOptions.map((option) => this.toOptionDto(option)),
    };

    // Only attach groups/specNote for steps that actually have groups, to
    // match the legacy STEPS array shape (e.g. "tank" has neither key).
    if (activeGroups.length > 0) {
      dto.groups = activeGroups.map((group) => ({
        id: group.groupCode,
        label: group.label,
        tagline: group.tagline ?? undefined,
        recommendation: group.recommendation ?? undefined,
        parentLabel: group.parentLabel ?? undefined,
      }));
      dto.specNote = Object.fromEntries(
        activeGroups
          .filter((group) => group.specNote)
          .map((group) => [group.groupCode, group.specNote as string]),
      );
    }

    return dto;
  }

  private toOptionDto(option: ProductOption): OptionResponseDto {
    return {
      id: option.skuCode,
      group: option.group?.groupCode,
      name: option.name,
      priceRMB: option.priceRmb,
      weight: option.weightKg,
      capacity: option.capacityKg ?? undefined,
      badge: option.badgeText ?? undefined,
      def: option.isDefault || undefined,
      img: option.imageUrl ?? undefined,
      swatchImg: option.swatchImageUrl ?? undefined,
    };
  }
}
