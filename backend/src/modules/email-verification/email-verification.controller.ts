import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Controller('api/email-verification')
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async send(@Body() dto: SendCodeDto): Promise<{ ok: true }> {
    await this.emailVerificationService.sendCode(dto.email);
    return { ok: true };
  }

  // Returns the opaque verification token the frontend must carry into
  // POST /api/orders as emailVerificationToken - the backend re-validates
  // it there rather than trusting the client's "verified" state.
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyCodeDto): Promise<{ verified: true; token: string }> {
    const token = await this.emailVerificationService.verifyCode(dto.email, dto.code);
    return { verified: true, token };
  }
}
