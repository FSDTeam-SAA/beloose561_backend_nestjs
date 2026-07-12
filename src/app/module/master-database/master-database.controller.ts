import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { fileUpload } from '../../helpers/fileUploder';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateMasterDatabaseDto } from './dto/create-master-database.dto';
import { MasterDatabaseService } from './master-database.service';

@ApiTags('master-database')
@Controller('master-database')
export class MasterDatabaseController {
  constructor(private readonly masterDatabaseService: MasterDatabaseService) {}

  @Post()
  @ApiOperation({ summary: 'Create master database' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createMasterDatabase(
    @Body() createMasterDatabaseDto: CreateMasterDatabaseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.masterDatabaseService.createMasterDatabase(
      createMasterDatabaseDto,
      file,
    );

    return {
      message: 'Master database created successfully',
      data: result,
    };
  }
}
