import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** A brand-new walk-in visitor entering their own details (PRD v2 §3 Step 3). */
export class NewVisitorDto {
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

export class SelfCheckInDto {
  @ApiPropertyOptional({
    description:
      'Pre-registered path: the typed entry code. The server resolves the expected visit from this code — clients never pass a visit id (prevents impersonation via a guessable/returned id).',
  })
  @IsOptional()
  @IsString()
  entryCode?: string;

  @ApiPropertyOptional({ type: NewVisitorDto, description: 'Walk-in path: the details captured this visit (no Visitor record kept).' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewVisitorDto)
  newVisitor?: NewVisitorDto;

  @ApiPropertyOptional({ description: 'Host being visited — required for walk-ins; ignored for pre-registered.' })
  @IsOptional()
  @IsString()
  hostId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Base64 headshot captured at the device (PRD v2 §3 Step 5).' })
  @IsOptional()
  @IsString()
  headshot?: string;

  @ApiPropertyOptional({ description: 'Base64 PNG of the drawn signature (PRD v2 §3 Step 7).' })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({ description: 'Version of the consent policy the visitor agreed to (PRD v2 §5.3).' })
  @IsString()
  @MinLength(1)
  consentVersion!: string;

  @ApiPropertyOptional({ description: 'Tap-to-agree consent — must be true to proceed.' })
  @IsBoolean()
  consentAccepted!: boolean;
}
