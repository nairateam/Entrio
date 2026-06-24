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
}
