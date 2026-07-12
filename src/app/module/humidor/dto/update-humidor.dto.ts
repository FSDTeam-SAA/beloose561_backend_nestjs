import { PartialType } from '@nestjs/swagger';
import { CreateHumidorDto } from './create-humidor.dto';

export class UpdateHumidorDto extends PartialType(CreateHumidorDto) {}
