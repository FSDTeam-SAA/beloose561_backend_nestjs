import { Injectable } from '@nestjs/common';
import { CreateHumidorDto } from './dto/create-humidor.dto';
import { UpdateHumidorDto } from './dto/update-humidor.dto';

@Injectable()
export class HumidorService {
  create(createHumidorDto: CreateHumidorDto) {
    return 'This action adds a new humidor';
  }

  findAll() {
    return `This action returns all humidor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} humidor`;
  }

  update(id: number, updateHumidorDto: UpdateHumidorDto) {
    return `This action updates a #${id} humidor`;
  }

  remove(id: number) {
    return `This action removes a #${id} humidor`;
  }
}
