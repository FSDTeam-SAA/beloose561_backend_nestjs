import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class JournalIdDto {
  @ApiProperty({ description: 'Journal entry ID' })
  @IsMongoId()
  id!: string;
}
