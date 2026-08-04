import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialMediaController } from './social-media.controller';
import { SocialMediaService } from './social-media.service';
import { SocialMediaSchema } from './entities/social-media.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SocialMedia', schema: SocialMediaSchema },
    ]),
  ],
  controllers: [SocialMediaController],
  providers: [SocialMediaService],
})
export class SocialMediaModule {}
