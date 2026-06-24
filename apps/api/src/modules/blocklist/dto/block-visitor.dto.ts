import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class BlockVisitorDto {
  @ApiProperty({ description: 'Reason for the building-wide block (PRD §4.7/§4.12).' })
  @IsString()
  @MinLength(1)
  reason!: string;
}
