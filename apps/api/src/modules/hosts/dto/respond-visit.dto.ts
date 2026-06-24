import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RespondVisitDto {
  @ApiProperty({ description: 'Message sent to the front desk (predefined or custom).' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;
}
