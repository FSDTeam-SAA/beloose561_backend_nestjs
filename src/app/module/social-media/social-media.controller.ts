import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { SocialMediaService } from './social-media.service';
import { CreateSocialMediaDto } from './dto/create-social-media.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';

@ApiTags('Social Media')
@Controller('social-media')
export class SocialMediaController {
  constructor(private readonly socialMediaService: SocialMediaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new social media config' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async createSocialMedia(@Body() createSocialMediaDto: CreateSocialMediaDto) {
    const result =
      await this.socialMediaService.createSocialMedia(createSocialMediaDto);
    return {
      message: 'Social media created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all social media configs' })
  @ApiQuery({ name: 'searchTerm', description: 'Search term', required: false })
  @ApiQuery({
    name: 'description',
    description: 'Description filter',
    required: false,
  })
  @ApiQuery({
    name: 'platform',
    description: 'Social link platform filter',
    required: false,
  })
  @ApiQuery({
    name: 'url',
    description: 'Social link url filter',
    required: false,
  })
  @ApiQuery({
    name: 'isActive',
    description: 'Is active filter',
    required: false,
  })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({
    name: 'limit',
    description: 'Limit of items per page',
    required: false,
  })
  @ApiQuery({ name: 'sortBy', description: 'Sort by field', required: false })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort order field',
    required: false,
  })
  @HttpCode(HttpStatus.OK)
  async getAllSocialMedia(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'description',
      'platform',
      'url',
      'isActive',
    ]);
    const params = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.socialMediaService.getAllSocialMedia(
      filters,
      params,
    );
    return {
      message: 'Social media retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get social media by ID' })
  @HttpCode(HttpStatus.OK)
  async getSocialMedia(@Param('id') id: string) {
    const result = await this.socialMediaService.getSocialMedia(id);
    return {
      message: 'Social media retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update social media by ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async updateSocialMedia(
    @Param('id') id: string,
    @Body() updateSocialMediaDto: UpdateSocialMediaDto,
  ) {
    const result = await this.socialMediaService.updateSocialMedia(
      id,
      updateSocialMediaDto,
    );
    return {
      message: 'Social media updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete social media by ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteSocialMedia(@Param('id') id: string) {
    const result = await this.socialMediaService.deleteSocialMedia(id);
    return {
      message: 'Social media deleted successfully',
      data: result,
    };
  }
}
