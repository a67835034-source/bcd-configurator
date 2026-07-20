import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// One row per "send code" request. codeHash (never the raw code) is
// compared at verify time; verificationToken is only populated once
// verification succeeds, and is what the frontend carries into
// POST /api/orders as proof the email was actually confirmed - the backend
// re-checks this row server-side (see OrdersService.createOrder), never
// trusting a client-side "verified" flag alone.
@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  email!: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 64 })
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'verification_token', type: 'varchar', length: 64, nullable: true })
  verificationToken!: string | null;

  // Failed verify() attempts against this specific code - capped to stop
  // someone brute-forcing a 6-digit code (1,000,000 possibilities) via
  // repeated guesses against the same row.
  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
