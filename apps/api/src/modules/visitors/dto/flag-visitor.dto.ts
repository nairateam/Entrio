import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class FlagVisitorDto {
  @ApiProperty({ description: 'Why the visitor is being flagged for review.' })
  @IsString()
  @MinLength(1)
  note!: string;
}
