import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HumidorService } from './humidor.service';
import { CreateHumidorDto } from './dto/create-humidor.dto';
import { UpdateHumidorDto } from './dto/update-humidor.dto';

@Controller('humidor')
export class HumidorController {
  constructor(private readonly humidorService: HumidorService) {}

  @Post()
  create(@Body() createHumidorDto: CreateHumidorDto) {
    return this.humidorService.create(createHumidorDto);
  }

  @Get()
  findAll() {
    return this.humidorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.humidorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHumidorDto: UpdateHumidorDto) {
    return this.humidorService.update(+id, updateHumidorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.humidorService.remove(+id);
  }
}
