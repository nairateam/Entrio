import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SelfCheckOutDto {
  @ApiProperty({ description: 'The visit to close out — resolved by code or disambiguation search.' })
  @IsString()
  @MinLength(1)
  visitId!: string;
}
