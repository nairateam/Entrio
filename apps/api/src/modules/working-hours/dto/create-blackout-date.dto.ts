import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateBlackoutDateDto {
  @ApiProperty({ example: '2026-12-25', description: 'Closed date, YYYY-MM-DD.' })
  @IsString()
  @Matches(ISO_DATE, { message: 'date must be YYYY-MM-DD' })
  date!: string;

  @ApiProperty({ example: 'Christmas Day' })
  @IsString()
  @MinLength(1)
  reason!: string;
}
