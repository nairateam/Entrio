import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Main Lobby Device', description: 'Human label to tell devices apart.' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  label!: string;
}
