import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PreRegisterVisitorDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(3)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

/** Pre-register an expected visit (PRD v2 §3.2). Host registers for themselves; Admin may set any host. */
export class PreRegisterDto {
  @ApiPropertyOptional({ description: 'An existing visitor to pre-register.' })
  @IsOptional()
  @IsString()
  visitorId?: string;

  @ApiPropertyOptional({ type: PreRegisterVisitorDto, description: 'A new visitor to create and pre-register.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreRegisterVisitorDto)
  newVisitor?: PreRegisterVisitorDto;

  @ApiPropertyOptional({ description: 'Host being visited (Admin only — Hosts always register for themselves).' })
  @IsOptional()
  @IsString()
  hostId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Expected arrival time (ISO 8601).' })
  @IsOptional()
  @IsISO8601()
  expectedTime?: string;
}
