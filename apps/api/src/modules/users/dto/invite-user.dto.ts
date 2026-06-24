import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class InviteUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;
}
