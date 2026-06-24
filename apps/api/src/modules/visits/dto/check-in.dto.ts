import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CheckInDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  visitorId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  hostId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({
    description:
      'Id of an approved override request — required to check in outside working hours (PRD §4.8).',
  })
  @IsOptional()
  @IsString()
  overrideRequestId?: string;

  @ApiPropertyOptional({
    description:
      'Id of the pending `expected` visit being fulfilled — transitions it in place instead of creating a new visit (PRD §4.2).',
  })
  @IsOptional()
  @IsString()
  expectedVisitId?: string;

  @ApiPropertyOptional({
    description:
      'Newly captured headshot as a base64 data URL. Uploaded to Cloudinary and saved as the visitor photo (PRD §4.1.7). Omit to keep the existing photo.',
  })
  @IsOptional()
  @IsString()
  headshot?: string;
}
