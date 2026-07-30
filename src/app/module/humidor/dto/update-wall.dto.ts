import { PartialType } from '@nestjs/swagger';
import { HumidorWallDto } from './create-humidor.dto';

export class UpdateWallDto extends PartialType(HumidorWallDto) {}
