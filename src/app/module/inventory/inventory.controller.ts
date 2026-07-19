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
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from '../../helpers/fileUploder';
import pick from '../../helpers/pick';
import AuthGuard from '../../middlewares/auth.guard';
import { AddStaffPickDto } from './dto/add-staff-pick.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { DiscountInventoryDto } from './dto/discount-inventory.dto';
import { FeatureInventoryDto } from './dto/feature-inventory.dto';
import { GuidedDiscoveryDto } from './dto/guided-discovery.dto';
import { MarkNewArrivalDto } from './dto/mark-new-arrival.dto';
import { SetDailyFeaturedDto } from './dto/set-daily-featured.dto';
import { UpdateDailyFeaturedDto } from './dto/update-daily-featured.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateNewArrivalDto } from './dto/update-new-arrival.dto';
import { UpdateStaffPickDto } from './dto/update-staff-pick.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('/my-inventory')
  @ApiOperation({ summary: 'Get my retailer inventory list' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @ApiQuery({ name: 'searchTerm', type: 'string', required: false })
  @ApiQuery({ name: 'name', type: 'string', required: false })
  @ApiQuery({ name: 'brand', type: 'string', required: false })
  @ApiQuery({ name: 'productLine', type: 'string', required: false })
  @ApiQuery({ name: 'manufacturer', type: 'string', required: false })
  @ApiQuery({ name: 'country', type: 'string', required: false })
  @ApiQuery({ name: 'wrapper', type: 'string', required: false })
  @ApiQuery({ name: 'binder', type: 'string', required: false })
  @ApiQuery({ name: 'filler', type: 'string', required: false })
  @ApiQuery({ name: 'strength', type: 'string', required: false })
  @ApiQuery({ name: 'size', type: 'string', required: false })
  @ApiQuery({ name: 'length', type: 'string', required: false })
  @ApiQuery({ name: 'flavorNotes', type: 'string', required: false })
  @ApiQuery({ name: 'smokingTime', type: 'string', required: false })
  @ApiQuery({ name: 'description', type: 'string', required: false })
  @ApiQuery({ name: 'whyYoullLikeThis', type: 'string', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false })
  @HttpCode(HttpStatus.OK)
  async getMyInventory(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'brand',
      'productLine',
      'manufacturer',
      'country',
      'wrapper',
      'binder',
      'filler',
      'strength',
      'size',
      'length',
      'flavorNotes',
      'smokingTime',
      'description',
      'whyYoullLikeThis',
      'status',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.inventoryService.getMyInventory(
      req.user!.id,
      filters,
      options,
    );

    return {
      message: 'Inventory retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('/opportunities/my')
  @ApiOperation({
    summary:
      'Get "Inventory Opportunities" - cigars with no sale (and/or no customer search) in the given window',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @ApiQuery({
    name: 'days',
    type: 'number',
    required: false,
    description: 'Lookback window in days (default 90)',
  })
  @HttpCode(HttpStatus.OK)
  async getInventoryOpportunities(@Req() req: Request) {
    const days = req.query.days ? Number(req.query.days) : undefined;
    const result = await this.inventoryService.getInventoryOpportunities(
      req.user!.id,
      days,
    );

    return {
      message: 'Inventory opportunities retrieved successfully',
      data: result,
    };
  }

  @Get('/opportunities/summary/my')
  @ApiOperation({
    summary:
      'Dashboard widget - count of cigars needing attention (Inventory Opportunities)',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @ApiQuery({
    name: 'days',
    type: 'number',
    required: false,
    description: 'Lookback window in days (default 90)',
  })
  @HttpCode(HttpStatus.OK)
  async getInventoryOpportunitiesSummary(@Req() req: Request) {
    const days = req.query.days ? Number(req.query.days) : undefined;
    const result = await this.inventoryService.getInventoryOpportunitiesSummary(
      req.user!.id,
      days,
    );

    return {
      message: 'Inventory opportunities summary retrieved successfully',
      data: result,
    };
  }

  @Get('/staff-picks/my')
  @ApiOperation({ summary: 'Get my retailer current Staff Picks' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getMyStaffPicks(@Req() req: Request) {
    const result = await this.inventoryService.getMyStaffPicks(req.user!.id);

    return {
      message: 'Staff picks retrieved successfully',
      data: result,
    };
  }

  @Get('/new-arrivals/my')
  @ApiOperation({ summary: 'Get my retailer current New Arrivals' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getMyNewArrivals(@Req() req: Request) {
    const result = await this.inventoryService.getMyNewArrivals(req.user!.id);

    return {
      message: 'New arrivals retrieved successfully',
      data: result,
    };
  }

  @Get('/daily-featured/my')
  @ApiOperation({
    summary: "Get my retailer Today's Featured + Tomorrow's planned",
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getMyDailyFeatured(@Req() req: Request) {
    const result = await this.inventoryService.getMyDailyFeatured(req.user!.id);

    return {
      message: 'Daily featured retrieved successfully',
      data: result,
    };
  }

  @Delete('/daily-featured/my/clear')
  @ApiOperation({ summary: "🗑️ Clear All Featured - today's items only" })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async clearAllDailyFeaturedToday(@Req() req: Request) {
    const result = await this.inventoryService.clearAllDailyFeaturedToday(
      req.user!.id,
    );

    return {
      message: 'All featured cleared successfully',
      data: result,
    };
  }

  @Get('/customer-search/quick')
  @ApiOperation({
    summary: 'Customer Search - Quick Search (staff searching for a customer)',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @ApiQuery({ name: 'searchTerm', type: 'string', required: false })
  @ApiQuery({ name: 'strength', type: 'string', required: false })
  @ApiQuery({ name: 'size', type: 'string', required: false })
  @ApiQuery({ name: 'minPrice', type: 'number', required: false })
  @ApiQuery({ name: 'maxPrice', type: 'number', required: false })
  @ApiQuery({ name: 'inStockOnly', type: 'boolean', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false })
  @HttpCode(HttpStatus.OK)
  async quickSearchForRetailer(@Req() req: Request) {
    const { searchTerm, strength, size, minPrice, maxPrice, inStockOnly } =
      req.query;
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await this.inventoryService.quickSearchForRetailer(
      req.user!.id,
      {
        searchTerm: searchTerm as string | undefined,
        strength: strength as string | undefined,
        size: size as string | undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        inStockOnly: inStockOnly === 'true',
      },
      options,
    );

    return {
      message: 'Search results retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('/customer-search/guided')
  @ApiOperation({
    summary: 'Customer Search - Guided Discovery (ranked recommendations)',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async guidedDiscoverySearch(
    @Req() req: Request,
    @Body() guidedDiscoveryDto: GuidedDiscoveryDto,
  ) {
    const result = await this.inventoryService.guidedDiscoverySearch(
      req.user!.id,
      guidedDiscoveryDto,
    );

    return {
      message: 'Guided discovery results retrieved successfully',
      data: result,
    };
  }

  @Get('/customer-search/browse')
  @ApiOperation({ summary: 'Customer Search - Browse All Inventory' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @ApiQuery({ name: 'humidorId', type: 'string', required: false })
  @ApiQuery({ name: 'shelfName', type: 'string', required: false })
  @ApiQuery({
    name: 'inStockOnly',
    type: 'boolean',
    required: false,
    description: 'Defaults to true',
  })
  @ApiQuery({
    name: 'sortBy',
    enum: ['name', 'price', 'strength'],
    required: false,
  })
  @ApiQuery({ name: 'sortOrder', enum: ['asc', 'desc'], required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @HttpCode(HttpStatus.OK)
  async browseInventoryForRetailer(@Req() req: Request) {
    const { humidorId, shelfName, inStockOnly, sortBy, sortOrder } = req.query;
    const options = pick(req.query, ['limit', 'page']);

    const result = await this.inventoryService.browseInventoryForRetailer(
      req.user!.id,
      {
        humidorId: humidorId as string | undefined,
        shelfName: shelfName as string | undefined,
        inStockOnly: inStockOnly === undefined ? true : inStockOnly === 'true',
        sortBy: sortBy as 'name' | 'price' | 'strength' | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      },
      options,
    );

    return {
      message: 'Inventory retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('/')
  @ApiOperation({ summary: 'Get all admin inventory list' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({ name: 'searchTerm', type: 'string', required: false })
  @ApiQuery({ name: 'name', type: 'string', required: false })
  @ApiQuery({ name: 'brand', type: 'string', required: false })
  @ApiQuery({ name: 'productLine', type: 'string', required: false })
  @ApiQuery({ name: 'manufacturer', type: 'string', required: false })
  @ApiQuery({ name: 'country', type: 'string', required: false })
  @ApiQuery({ name: 'wrapper', type: 'string', required: false })
  @ApiQuery({ name: 'binder', type: 'string', required: false })
  @ApiQuery({ name: 'filler', type: 'string', required: false })
  @ApiQuery({ name: 'strength', type: 'string', required: false })
  @ApiQuery({ name: 'size', type: 'string', required: false })
  @ApiQuery({ name: 'length', type: 'string', required: false })
  @ApiQuery({ name: 'flavorNotes', type: 'string', required: false })
  @ApiQuery({ name: 'smokingTime', type: 'string', required: false })
  @ApiQuery({ name: 'description', type: 'string', required: false })
  @ApiQuery({ name: 'whyYoullLikeThis', type: 'string', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllInventory(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'brand',
      'productLine',
      'manufacturer',
      'country',
      'wrapper',
      'binder',
      'filler',
      'strength',
      'size',
      'length',
      'flavorNotes',
      'smokingTime',
      'description',
      'whyYoullLikeThis',
      'status',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.inventoryService.getAllInventory(
      filters,
      options,
    );

    return {
      message: 'Inventory retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':slug/inventory-list')
  @ApiOperation({ summary: 'Get retailer inventory list' })
  @ApiQuery({ name: 'searchTerm', type: 'string', required: false })
  @ApiQuery({ name: 'name', type: 'string', required: false })
  @ApiQuery({ name: 'brand', type: 'string', required: false })
  @ApiQuery({ name: 'productLine', type: 'string', required: false })
  @ApiQuery({ name: 'manufacturer', type: 'string', required: false })
  @ApiQuery({ name: 'country', type: 'string', required: false })
  @ApiQuery({ name: 'wrapper', type: 'string', required: false })
  @ApiQuery({ name: 'binder', type: 'string', required: false })
  @ApiQuery({ name: 'filler', type: 'string', required: false })
  @ApiQuery({ name: 'strength', type: 'string', required: false })
  @ApiQuery({ name: 'size', type: 'string', required: false })
  @ApiQuery({ name: 'length', type: 'string', required: false })
  @ApiQuery({ name: 'flavorNotes', type: 'string', required: false })
  @ApiQuery({ name: 'smokingTime', type: 'string', required: false })
  @ApiQuery({ name: 'description', type: 'string', required: false })
  @ApiQuery({ name: 'whyYoullLikeThis', type: 'string', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false })
  @HttpCode(HttpStatus.OK)
  async getInventorys(@Param('slug') slug: string, @Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'brand',
      'productLine',
      'manufacturer',
      'country',
      'wrapper',
      'binder',
      'filler',
      'strength',
      'size',
      'length',
      'flavorNotes',
      'smokingTime',
      'description',
      'whyYoullLikeThis',
      'status',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.inventoryService.getInventorys(
      slug,
      filters,
      options,
    );

    return {
      message: 'Inventory retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':slug/staff-picks')
  @ApiOperation({
    summary: "Customer App - get a store's Staff Picks (public)",
  })
  @HttpCode(HttpStatus.OK)
  async getStaffPicksByStore(@Param('slug') slug: string) {
    const result = await this.inventoryService.getStaffPicksByStore(slug);

    return {
      message: 'Staff picks retrieved successfully',
      data: result,
    };
  }

  @Get(':slug/new-arrivals')
  @ApiOperation({
    summary: "Customer App - get a store's New Arrivals (public)",
  })
  @HttpCode(HttpStatus.OK)
  async getNewArrivalsByStore(@Param('slug') slug: string) {
    const result = await this.inventoryService.getNewArrivalsByStore(slug);

    return {
      message: 'New arrivals retrieved successfully',
      data: result,
    };
  }

  @Get(':slug/daily-featured')
  @ApiOperation({
    summary: "Customer App - get a store's Today's Featured (public)",
  })
  @HttpCode(HttpStatus.OK)
  async getDailyFeaturedByStore(@Param('slug') slug: string) {
    const result = await this.inventoryService.getDailyFeaturedByStore(slug);

    return {
      message: 'Daily featured retrieved successfully',
      data: result,
    };
  }

  @Get(':slug/surprise-me')
  @ApiOperation({
    summary:
      '🎲 Surprise Me - weighted-random cigar pick for a browsing customer (public)',
  })
  @ApiQuery({
    name: 'exclude',
    type: 'string',
    required: false,
    description:
      'Comma-separated ids of cigars already shown this session (from previous "Try Another" calls)',
  })
  @HttpCode(HttpStatus.OK)
  async getSurpriseMe(
    @Param('slug') slug: string,
    @Query('exclude') exclude?: string,
  ) {
    const excludeIds = exclude
      ? exclude
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    const result = await this.inventoryService.getSurpriseMe(slug, excludeIds);

    return {
      message: 'Surprise pick retrieved successfully',
      data: result,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create inventory' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createInventory(
    @Req() req: Request,
    @Body() createInventoryDto: CreateInventoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.inventoryService.createInventory(
      req.user!.id,
      createInventoryDto,
      file,
    );

    return {
      message: 'Inventory created successfully',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit inventory item' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async updateInventory(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.inventoryService.updateInventory(
      id,
      updateInventoryDto,
      file,
    );

    return {
      message: 'Inventory updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory item' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async deleteInventory(@Param('id') id: string) {
    const result = await this.inventoryService.deleteInventory(id);

    return {
      message: 'Inventory deleted successfully',
      data: result,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update inventory status admin' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'active',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async adminUpdateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const result = await this.inventoryService.adminUpdateStatus(id, status);

    return {
      message: 'Inventory status updated successfully',
      data: result,
    };
  }

  @Patch(':id/feature')
  @ApiOperation({
    summary: '⭐ Feature It - mark a cigar as Staff Pick / Daily Featured',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async featureInventory(
    @Param('id') id: string,
    @Body() featureInventoryDto: FeatureInventoryDto,
  ) {
    const result = await this.inventoryService.featureInventory(
      id,
      featureInventoryDto,
    );

    return {
      message: 'Inventory marked as featured successfully',
      data: result,
    };
  }

  @Patch(':id/discount')
  @ApiOperation({ summary: '💰 Discount It - apply a % discount to a cigar' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async applyDiscount(
    @Param('id') id: string,
    @Body() discountInventoryDto: DiscountInventoryDto,
  ) {
    const result = await this.inventoryService.applyDiscount(
      id,
      discountInventoryDto,
    );

    return {
      message: 'Discount applied successfully',
      data: result,
    };
  }

  @Patch(':id/discount/remove')
  @ApiOperation({ summary: 'Remove an active discount from a cigar' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async removeDiscount(@Param('id') id: string) {
    const result = await this.inventoryService.removeDiscount(id);

    return {
      message: 'Discount removed successfully',
      data: result,
    };
  }

  @Post(':id/staff-pick')
  @ApiOperation({ summary: 'Add Staff Pick - mark an inventory item' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.CREATED)
  async addStaffPick(
    @Param('id') id: string,
    @Body() addStaffPickDto: AddStaffPickDto,
  ) {
    const result = await this.inventoryService.addStaffPick(
      id,
      addStaffPickDto,
    );

    return {
      message: 'Added as staff pick successfully',
      data: result,
    };
  }

  @Patch(':id/staff-pick')
  @ApiOperation({ summary: 'Edit Staff Pick note / staff name' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async updateStaffPick(
    @Param('id') id: string,
    @Body() updateStaffPickDto: UpdateStaffPickDto,
  ) {
    const result = await this.inventoryService.updateStaffPick(
      id,
      updateStaffPickDto,
    );

    return {
      message: 'Staff pick updated successfully',
      data: result,
    };
  }

  @Delete(':id/staff-pick')
  @ApiOperation({ summary: 'Remove Staff Pick' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async removeStaffPick(@Param('id') id: string) {
    const result = await this.inventoryService.removeStaffPick(id);

    return {
      message: 'Staff pick removed successfully',
      data: result,
    };
  }

  @Post(':id/new-arrival')
  @ApiOperation({ summary: 'Mark as New Arrival' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.CREATED)
  async markNewArrival(
    @Param('id') id: string,
    @Body() markNewArrivalDto: MarkNewArrivalDto,
  ) {
    const result = await this.inventoryService.markNewArrival(
      id,
      markNewArrivalDto,
    );

    return {
      message: 'Marked as new arrival successfully',
      data: result,
    };
  }

  @Patch(':id/new-arrival')
  @ApiOperation({
    summary: 'Edit New Arrival - arrival date / note / auto-remove days',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async updateNewArrival(
    @Param('id') id: string,
    @Body() updateNewArrivalDto: UpdateNewArrivalDto,
  ) {
    const result = await this.inventoryService.updateNewArrival(
      id,
      updateNewArrivalDto,
    );

    return {
      message: 'New arrival updated successfully',
      data: result,
    };
  }

  @Delete(':id/new-arrival')
  @ApiOperation({ summary: 'Remove New Arrival' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async removeNewArrival(@Param('id') id: string) {
    const result = await this.inventoryService.removeNewArrival(id);

    return {
      message: 'New arrival removed successfully',
      data: result,
    };
  }

  @Post(':id/daily-featured')
  @ApiOperation({ summary: 'Set as Daily Featured (today / tomorrow)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.CREATED)
  async setDailyFeatured(
    @Param('id') id: string,
    @Body() setDailyFeaturedDto: SetDailyFeaturedDto,
  ) {
    const result = await this.inventoryService.setDailyFeatured(
      id,
      setDailyFeaturedDto,
    );

    return {
      message: 'Set as daily featured successfully',
      data: result,
    };
  }

  @Patch(':id/daily-featured')
  @ApiOperation({
    summary: 'Edit Daily Featured - date / note / featured price',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async updateDailyFeatured(
    @Param('id') id: string,
    @Body() updateDailyFeaturedDto: UpdateDailyFeaturedDto,
  ) {
    const result = await this.inventoryService.updateDailyFeatured(
      id,
      updateDailyFeaturedDto,
    );

    return {
      message: 'Daily featured updated successfully',
      data: result,
    };
  }

  @Delete(':id/daily-featured')
  @ApiOperation({ summary: 'Remove / Cancel Daily Featured' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async removeDailyFeatured(@Param('id') id: string) {
    const result = await this.inventoryService.removeDailyFeatured(id);

    return {
      message: 'Daily featured removed successfully',
      data: result,
    };
  }

  @Get(':id/customer-view')
  @ApiOperation({
    summary:
      '"Show Customer" - customer-facing detail view of one inventory item',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getCustomerViewDetail(@Param('id') id: string, @Req() req: Request) {
    const result = await this.inventoryService.getCustomerViewDetail(
      req.user!.id,
      id,
    );

    return {
      message: 'Customer view retrieved successfully',
      data: result,
    };
  }

  @Post(':id/share-link')
  @ApiOperation({
    summary:
      '"Show on Phone" - QR code link to this item\'s customer-facing page',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.CREATED)
  async generateCustomerShareLink(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const result = await this.inventoryService.generateCustomerShareLink(
      req.user!.id,
      id,
    );

    return {
      message: 'Share link generated successfully',
      data: result,
    };
  }
}
