import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Report filters (PRD §4.9). All optional; omitted/`all` means no constraint. */
export class ReportQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01', description: 'Start date YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'End date YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hostId?: string;

  @ApiPropertyOptional({ description: "A VisitStatus or 'all'" })
  @IsOptional()
  @IsString()
  status?: string;
}
