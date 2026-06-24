import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RequestOverrideDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  visitorId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  hostId!: string;

  @ApiProperty({ description: 'Why the after-hours check-in is necessary (PRD §4.8).' })
  @IsString()
  @MinLength(1)
  reason!: string;
}
