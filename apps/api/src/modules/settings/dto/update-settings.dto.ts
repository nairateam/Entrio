import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({ minimum: 1, maximum: 24 })
  @IsInt()
  @Min(1)
  @Max(24)
  overstayThresholdHours!: number;

  @ApiProperty()
  @IsBoolean()
  pushNotifications!: boolean;

  @ApiProperty()
  @IsBoolean()
  emailNotifications!: boolean;
}
