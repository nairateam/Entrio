import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AssignHostDto {
  @ApiProperty({ description: 'The host to assign to this walk-in.' })
  @IsString()
  @MinLength(1)
  hostId!: string;
}
