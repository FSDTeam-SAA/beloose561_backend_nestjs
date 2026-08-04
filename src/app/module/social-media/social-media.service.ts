import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import { CreateSocialMediaDto } from './dto/create-social-media.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';
import { SocialMediaDocument } from './entities/social-media.entity';

@Injectable()
export class SocialMediaService {
  constructor(
    @InjectModel('SocialMedia')
    private socialMediaModel: Model<SocialMediaDocument>,
  ) {}

  private readonly jsDelivrIconUrls: Record<string, string> = {
    linkedin:
      'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/linkedin.svg',
  };

  private normalizePlatformSlug(platform: string) {
    const normalized = String(platform ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    if (normalized === 'twitter') return 'x';
    return normalized;
  }

  private toSimpleIconUrl(platform: string) {
    const slug = this.normalizePlatformSlug(platform);
    if (this.jsDelivrIconUrls[slug]) return this.jsDelivrIconUrls[slug];
    return `https://cdn.simpleicons.org/${slug}`;
  }

  private normalizeSocialLinks<T extends { platform: string; icon?: string }>(
    links?: T[],
  ) {
    if (!links) return links;
    return links.map((link) => ({
      ...link,
      icon: this.toSimpleIconUrl(link.platform),
    }));
  }

  async createSocialMedia(createSocialMediaDto: CreateSocialMediaDto) {
    const payload = {
      ...createSocialMediaDto,
      socialLinks: this.normalizeSocialLinks(createSocialMediaDto.socialLinks),
    };
    const result = await this.socialMediaModel.create(payload);
    return result;
  }

  async getAllSocialMedia(params: IFilterParams, options: IOptions) {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(options);
    const normalizedParams: IFilterParams = { ...params };
    if (normalizedParams.platform !== undefined) {
      normalizedParams['socialLinks.platform'] = normalizedParams.platform;
      delete normalizedParams.platform;
    }
    if (normalizedParams.url !== undefined) {
      normalizedParams['socialLinks.url'] = normalizedParams.url;
      delete normalizedParams.url;
    }

    const whereConditions = buildWhereConditions(normalizedParams, [
      'description',
      'socialLinks.platform',
      'socialLinks.url',
    ]);
    const result = await this.socialMediaModel
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });
    const total = await this.socialMediaModel.countDocuments(whereConditions);
    return {
      data: result,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getSocialMedia(id: string) {
    const result = await this.socialMediaModel.findById(id);
    if (!result) {
      throw new HttpException('Social media not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  async updateSocialMedia(
    id: string,
    updateSocialMediaDto: UpdateSocialMediaDto,
  ) {
    const payload = {
      ...updateSocialMediaDto,
      socialLinks: this.normalizeSocialLinks(updateSocialMediaDto.socialLinks),
    };
    const result = await this.socialMediaModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    if (!result) {
      throw new HttpException('Social media not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  async deleteSocialMedia(id: string) {
    const result = await this.socialMediaModel.findByIdAndDelete(id);
    if (!result) {
      throw new HttpException('Social media not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }
}
