import { Module } from '@nestjs/common';
import { HumidorService } from './humidor.service';
import { HumidorController } from './humidor.controller';

@Module({
  controllers: [HumidorController],
  providers: [HumidorService],
})
export class HumidorModule {}
