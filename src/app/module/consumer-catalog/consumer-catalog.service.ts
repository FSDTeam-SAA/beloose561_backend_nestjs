import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MasterDatabase } from '../master-database/entities/master-database.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Retailer } from '../retailer/entities/retailer.entity';
import { Humidor } from '../humidor/entities/humidor.entity';
import { ConsumerScanService } from '../consumer-scan/consumer-scan.service';
import { ConsumerCigarService } from '../consumer-cigar/consumer-cigar.service';
import { ConsumerActivityService } from '../consumer-activity/consumer-activity.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { smokingTimeInMinutes } from '../../helpers/smokingTime';

@Injectable()
export class ConsumerCatalogService {
  constructor(
    @InjectModel(MasterDatabase.name)
    private readonly masterModel: Model<MasterDatabase>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<Inventory>,
    @InjectModel(Retailer.name) private readonly retailerModel: Model<Retailer>,
    @InjectModel(Humidor.name) private readonly humidorModel: Model<Humidor>,
    private readonly scanService: ConsumerScanService,
    private readonly userCigarService: ConsumerCigarService,
    private readonly activityService: ConsumerActivityService,
  ) {}

  // Shared catalog selection for discover and recommendations.
  private async buildCatalogFilter(query: CatalogQueryDto) {
    if (
      query.minPrice != null &&
      query.maxPrice != null &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot exceed maxPrice');
    }
    const filter: Record<string, unknown> = { status: 'active' };
    const exactMatch = (value: string) =>
      new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    for (const field of ['brand', 'strength', 'wrapper', 'size'] as const) {
      if (query[field]) filter[field] = exactMatch(query[field]);
    }
    if (query.origin) filter.country = exactMatch(query.origin);
    if (query.flavor) filter.flavorNotes = exactMatch(query.flavor);
    if (query.smokingTime) {
      const minutes = smokingTimeInMinutes(query.smokingTime);
      const values =
        minutes === undefined
          ? [query.smokingTime]
          : [
              query.smokingTime,
              String(minutes),
              `${minutes} Minutes`,
              `${minutes} mins`,
              `${minutes / 60} Hour`,
              `${minutes / 60} Hours`,
            ];
      filter.estimatedSmokingTime = { $in: values.map(exactMatch) };
    }
    if (query.search?.trim()) {
      const search = new RegExp(
        query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      filter.$or = ['brand', 'productLine', 'name'].map((field) => ({
        [field]: search,
      }));
    }
    const priceFilter: Record<string, number> = {};
    if (query.minPrice != null) priceFilter.$gte = query.minPrice;
    if (query.maxPrice != null) priceFilter.$lte = query.maxPrice;

    let inventory: Pick<
      Inventory,
      'masterCigarId' | 'price' | 'isStaffPick'
    >[] = [];
    if (query.retailerId) {
      const retailer = await this.retailerModel.exists({
        _id: query.retailerId,
        status: 'approved',
      });
      if (!retailer) throw new NotFoundException('Approved retailer not found');
      const humidorIds = (
        await this.humidorModel.distinct('_id', {
          retailerId: query.retailerId,
          isActive: true,
        })
      ).map(String);
      inventory = await this.inventoryModel
        .find({
          retailerId: query.retailerId,
          humidorId: { $in: humidorIds },
          status: 'active',
          quantity: { $gt: 0 },
          masterCigarId: { $ne: null },
          ...(Object.keys(priceFilter).length ? { price: priceFilter } : {}),
        })
        .select('masterCigarId price isStaffPick')
        .sort({ _id: 1 })
        .lean();
      filter._id = { $in: inventory.map((item) => item.masterCigarId) };
    } else if (Object.keys(priceFilter).length) {
      filter.suggestedRetailPriceEach = priceFilter;
    }
    return { filter, inventory };
  }

  async getCandidates(query: CatalogQueryDto) {
    const { filter, inventory } = await this.buildCatalogFilter(query);
    const cigars = await this.masterModel.find(filter).sort({ _id: 1 });
    return { cigars, inventory };
  }

  async discover(query: CatalogQueryDto, userId?: string) {
    const { filter, inventory } = await this.buildCatalogFilter(query);
    const page = await this.masterModel
      .find(filter)
      .sort({ _id: 1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit);
    const total = await this.masterModel.countDocuments(filter);
    const data = page.map((cigar) => {
      const stock = inventory.find(
        (item) => String(item.masterCigarId) === String(cigar._id),
      );
      return {
        ...this.scanService.getCigarDetails(cigar),
        price: stock?.price ?? cigar.suggestedRetailPriceEach ?? null,
        available: query.retailerId ? true : null,
      };
    });
    if (userId)
      await this.activityService.record(userId, 'search', {
        searchTerm: query.search,
        retailerId: query.retailerId,
      });
    return {
      data,
      meta: { page: query.page, limit: query.limit, total },
    };
  }

  async getDetail(cigarId: string, retailerId?: string, userId?: string) {
    const cigar = await this.masterModel.findOne({
      _id: cigarId,
      status: 'active',
    });
    if (!cigar) throw new NotFoundException('Active cigar not found');
    const storeAvailability = retailerId
      ? await this.scanService.getStoreAvailability(cigarId, retailerId)
      : null;
    const state = userId
      ? await this.userCigarService.getUserState(userId, cigarId)
      : null;
    if (userId)
      await this.activityService.record(userId, 'view', {
        cigarId,
        retailerId,
      });
    return {
      cigar: this.scanService.getCigarDetails(cigar),
      storeAvailability,
      userState: {
        favorite: state?.isFavorite ?? false,
        wantToTry: state?.wantToTry ?? false,
        smoked: state?.hasSmoked ?? false,
        rating: state?.rating ?? null,
      },
    };
  }
}
