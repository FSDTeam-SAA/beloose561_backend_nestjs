import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../../middlewares/auth.guard';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get Settings' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async getSettings() {
    const result = await this.settingsService.getSettings();
    return {
      message: 'Settings retrieved successfully',
      data: result,
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update Settings' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async updateSettings(@Body() updateSettingDto: UpdateSettingDto) {
    const result = await this.settingsService.updateSettings(updateSettingDto);
    return {
      message: 'Settings updated successfully',
      data: result,
    };
  }
}
