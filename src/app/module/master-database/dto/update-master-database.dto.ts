import { PartialType } from '@nestjs/swagger';
import { CreateMasterDatabaseDto } from './create-master-database.dto';

export class UpdateMasterDatabaseDto extends PartialType(
  CreateMasterDatabaseDto,
) {}
