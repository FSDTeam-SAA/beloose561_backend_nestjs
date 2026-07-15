import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Qrcode, QrcodeSchema } from '../qrcodes/entities/qrcode.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Retailer, RetailerSchema } from './entities/retailer.entity';
import { RetailerController } from './retailer.controller';
import { RetailerService } from './retailer.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Retailer.name, schema: RetailerSchema },
      { name: User.name, schema: UserSchema },
      { name: Qrcode.name, schema: QrcodeSchema },
    ]),
  ],
  controllers: [RetailerController],
  providers: [RetailerService],
})
export class RetailerModule {}
