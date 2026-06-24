import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AddRestrictionDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  visitorName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  visitorPhone!: string;

  @ApiProperty({ description: 'Private reason, visible only to the host and Admin (PRD §4.11).' })
  @IsString()
  @MinLength(1)
  reason!: string;
}
