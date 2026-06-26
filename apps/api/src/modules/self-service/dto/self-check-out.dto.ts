import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SelfCheckOutDto {
  @ApiProperty({
    description:
      'The visitor\'s own entry code. The server resolves the active visit from it — a visit id is never accepted (prevents checking out an arbitrary visitor).',
  })
  @IsString()
  @MinLength(1)
  entryCode!: string;
}
