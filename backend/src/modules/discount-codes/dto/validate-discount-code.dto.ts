import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from '../../orders/dto/create-order.dto';

export class ValidateDiscountCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
