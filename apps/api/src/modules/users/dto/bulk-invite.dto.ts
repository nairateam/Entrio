import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';
import { InviteUserDto } from './invite-user.dto';

/** Invite many users in one request (admin CSV upload). Capped to keep one
 * request bounded — larger imports should be split. */
export class BulkInviteDto {
  @ApiProperty({ type: [InviteUserDto] })
  @ValidateNested({ each: true })
  @Type(() => InviteUserDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  users!: InviteUserDto[];
}
