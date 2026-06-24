import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, Matches } from 'class-validator';

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpsertWorkingHourDto {
  @ApiProperty({ example: '08:00', description: 'Opening time, 24h HH:mm.' })
  @IsString()
  @Matches(TIME_24H, { message: 'openTime must be HH:mm (24h)' })
  openTime!: string;

  @ApiProperty({ example: '18:00', description: 'Closing time, 24h HH:mm.' })
  @IsString()
  @Matches(TIME_24H, { message: 'closeTime must be HH:mm (24h)' })
  closeTime!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}
