import { Injectable } from '@nestjs/common';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { UpdateShelfDto } from './dto/update-shelf.dto';

@Injectable()
export class ShelfService {
  create(createShelfDto: CreateShelfDto) {
    return 'This action adds a new shelf';
  }

  findAll() {
    return `This action returns all shelf`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shelf`;
  }

  update(id: number, updateShelfDto: UpdateShelfDto) {
    return `This action updates a #${id} shelf`;
  }

  remove(id: number) {
    return `This action removes a #${id} shelf`;
  }
}
