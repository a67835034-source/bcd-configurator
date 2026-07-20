import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';
import { StepResponseDto } from './dto/step-response.dto';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /api/products -> StepResponseDto[] (same shape as legacy STEPS array)
  @Get()
  async getProducts(): Promise<StepResponseDto[]> {
    return this.productsService.getAllSteps();
  }
}
