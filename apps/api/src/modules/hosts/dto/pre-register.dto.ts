import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

export class PreRegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  visitorName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  visitorPhone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  visitorEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({ example: '2026-06-25' })
  @IsString()
  @Matches(ISO_DATE, { message: 'expectedDate must be YYYY-MM-DD' })
  expectedDate!: string;

  @ApiProperty({ example: '14:30' })
  @IsString()
  @Matches(TIME_24H, { message: 'expectedTime must be HH:mm (24h)' })
  expectedTime!: string;
}
