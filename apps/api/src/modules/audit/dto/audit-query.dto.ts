import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AuditQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search across actor/target/detail/action' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "An action string or 'all'" })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '12' })
  @IsOptional()
  @IsString()
  pageSize?: string;
}
