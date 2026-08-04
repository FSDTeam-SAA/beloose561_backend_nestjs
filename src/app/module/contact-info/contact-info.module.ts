import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactInfoController } from './contact-info.controller';
import { ContactInfoService } from './contact-info.service';
import { ContactInfoSchema } from './entities/contact-info.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ContactInfo', schema: ContactInfoSchema },
    ]),
  ],
  controllers: [ContactInfoController],
  providers: [ContactInfoService],
})
export class ContactInfoModule {}
