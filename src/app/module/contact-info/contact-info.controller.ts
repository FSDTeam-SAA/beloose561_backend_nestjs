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
import { ContactInfoService } from './contact-info.service';
import { CreateContactInfoDto } from './dto/create-contact-info.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';

@ApiTags('Contact Info')
@Controller('contact-info')
export class ContactInfoController {
  constructor(private readonly contactInfoService: ContactInfoService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact info' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async createContactInfo(@Body() createContactInfoDto: CreateContactInfoDto) {
    const result =
      await this.contactInfoService.createContactInfo(createContactInfoDto);
    return {
      message: 'Contact info created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all contact info' })
  @ApiQuery({ name: 'searchTerm', description: 'Search term', required: false })
  @ApiQuery({ name: 'email', description: 'Email', required: false })
  @ApiQuery({ name: 'phone', description: 'Phone', required: false })
  @ApiQuery({ name: 'address', description: 'Address', required: false })
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
  async getAllContactInfo(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'email',
      'phone',
      'address',
    ]);
    const params = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.contactInfoService.getAllContactInfo(
      filters,
      params,
    );
    return {
      message: 'Contact info retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact info by ID' })
  @HttpCode(HttpStatus.OK)
  async getContactInfo(@Param('id') id: string) {
    const result = await this.contactInfoService.getContactInfo(id);
    return {
      message: 'Contact info retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact info by ID' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async updateContactInfo(
    @Param('id') id: string,
    @Body() updateContactInfoDto: UpdateContactInfoDto,
  ) {
    const result = await this.contactInfoService.updateContactInfo(
      id,
      updateContactInfoDto,
    );
    return {
      message: 'Contact info updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact info by ID' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteContactInfo(@Param('id') id: string) {
    const result = await this.contactInfoService.deleteContactInfo(id);
    return {
      message: 'Contact info deleted successfully',
      data: result,
    };
  }
}
