import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsString, MinLength, ValidateNested } from 'class-validator';

class PushKeysDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  p256dh!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  auth!: string;
}

export class SubscribePushDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  endpoint!: string;

  @ApiProperty({ type: PushKeysDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}

export class UnsubscribePushDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  endpoint!: string;
}
