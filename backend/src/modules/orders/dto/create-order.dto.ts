import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  optionSku!: string; // 補上 !

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number; // 補上 !
}

export class CreateOrderDto {
  // 聯絡資訊改為必填 - name/contact/email all required now, not just
  // enforced in the checkout form's UI.
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerName!: string;

  @IsOptional()
  @IsIn(['line', 'phone', 'email'])
  contactChannel?: string; // 選填欄位不需要 !

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  contactValue!: string;

  @IsEmail()
  @MaxLength(150)
  customerEmail!: string;

  // Issued by POST /api/email-verification/verify after the customer
  // confirms their 6-digit code - re-checked server-side against
  // EmailVerificationService (never trusted as a bare claim) inside
  // OrdersService.createOrder.
  @IsString()
  @IsNotEmpty()
  emailVerificationToken!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightTargetKg?: number; // 選填欄位不需要 !

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string; // 選填欄位不需要 !

  @IsOptional()
  @IsString()
  @MaxLength(30)
  discountCode?: string; // 選填欄位不需要 !

  // Raw LIFF ID token - verified server-side (see LineIdTokenVerifierService)
  // before its userId is trusted for anything, so no length/format
  // validation beyond "it's a string" belongs here.
  @IsOptional()
  @IsString()
  liffIdToken?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[]; // 補上 !
}