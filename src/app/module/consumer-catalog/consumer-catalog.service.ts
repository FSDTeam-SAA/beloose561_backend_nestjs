import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { MasterDatabase } from '../master-database/entities/master-database.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Retailer } from '../retailer/entities/retailer.entity';
import { Humidor } from '../humidor/entities/humidor.entity';
import { ConsumerScanService } from '../consumer-scan/consumer-scan.service';
import { ConsumerCigarService } from '../consumer-cigar/consumer-cigar.service';
import { ConsumerActivityService } from '../consumer-activity/consumer-activity.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import {
  NearbyCatalogQueryDto,
  NearbyStockQueryDto,
} from './dto/nearby-catalog-query.dto';
import { smokingTimeInMinutes } from '../../helpers/smokingTime';

type NearbyGeoQuery = {
  lat: number;
  lng: number;
  radius: number;
  minPrice?: number;
  maxPrice?: number;
};

type NearbyLocation = {
  humidorId: Types.ObjectId;
  humidor: string;
  wallId: Types.ObjectId | null;
  wall: string | null;
  shelfId: Types.ObjectId | null;
  shelf: string | null;
  column: number;
};

export type NearbyStore = {
  retailerId: Types.ObjectId;
  storeName: string;
  storeSlug: string;
  distance: number;
  price: number;
  pricePerBox: number;
  quantity: number;
};

export type NearbyStoreSelection = {
  store: NearbyStore;
  location: NearbyLocation;
};

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
        available: query.retailerId ? true : (cigar.available ?? true),
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

  async discoverNearby(query: NearbyCatalogQueryDto, userId?: string) {
    const catalogQuery = Object.assign(new CatalogQueryDto(), query, {
      retailerId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
    const { filter } = await this.buildCatalogFilter(catalogQuery);
    const stocksByCigar = await this.findNearbyStock(query);
    filter._id = {
      $in: [...stocksByCigar.keys()].map((id) => new Types.ObjectId(id)),
    };

    const page = await this.masterModel
      .find(filter)
      .sort({ _id: 1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit);
    const total = await this.masterModel.countDocuments(filter);
    const data = page.map((cigar) => ({
      ...this.scanService.getCigarDetails(cigar),
      available: true,
      store: stocksByCigar.get(String(cigar._id))![0].store,
    }));

    if (userId)
      await this.activityService.record(userId, 'search', {
        searchTerm: query.search,
      });
    return {
      data,
      meta: { page: query.page, limit: query.limit, total },
    };
  }

  async getNearbyCandidates(query: NearbyGeoQuery) {
    const stocksByCigar = await this.findNearbyStock(query);
    const cigarIds = [...stocksByCigar.keys()].map(
      (id) => new Types.ObjectId(id),
    );
    const cigars = await this.masterModel
      .find({ _id: { $in: cigarIds }, status: 'active' })
      .sort({ _id: 1 });
    return {
      cigars,
      stores: new Map(
        cigars.map((cigar) => [
          String(cigar._id),
          stocksByCigar.get(String(cigar._id))![0],
        ]),
      ),
    };
  }

  async getNearbyStock(cigarId: string, query: NearbyStockQueryDto) {
    if (!isObjectIdOrHexString(cigarId)) {
      throw new NotFoundException('Active cigar not found');
    }
    const cigar = await this.masterModel.exists({
      _id: cigarId,
      status: 'active',
    });
    if (!cigar) throw new NotFoundException('Active cigar not found');

    const stocksByCigar = await this.findNearbyStock(query, cigarId);
    const stocks = stocksByCigar.get(cigarId) ?? [];
    const data = stocks
      .slice((query.page - 1) * query.limit, query.page * query.limit)
      .map(({ store, location }) => ({
        ...store,
        available: true,
        location,
      }));
    return {
      data,
      meta: { page: query.page, limit: query.limit, total: stocks.length },
    };
  }

  private async findNearbyStock(
    query: NearbyGeoQuery,
    masterCigarId?: string,
  ): Promise<Map<string, NearbyStoreSelection[]>> {
    if (
      query.minPrice != null &&
      query.maxPrice != null &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot exceed maxPrice');
    }

    const nearbyRetailers = await this.retailerModel.aggregate<{
      _id: Types.ObjectId;
      storeName: string;
      storeSlug: string;
      distance: number;
    }>([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [query.lng, query.lat] },
          key: 'location',
          distanceField: 'distance',
          maxDistance: query.radius,
          spherical: true,
          query: { status: 'approved' },
        },
      },
      { $sort: { distance: 1, _id: 1 } },
      { $project: { storeName: 1, storeSlug: 1, distance: 1 } },
    ]);
    if (!nearbyRetailers.length) return new Map();

    const retailerIds = nearbyRetailers.map((retailer) => retailer._id);
    const humidors = await this.humidorModel
      .find({ retailerId: { $in: retailerIds }, isActive: true })
      .select('retailerId name walls shelfes')
      .lean();
    if (!humidors.length) return new Map();

    const price: Record<string, number> = {};
    if (query.minPrice != null) price.$gte = query.minPrice;
    if (query.maxPrice != null) price.$lte = query.maxPrice;
    const inventory = await this.inventoryModel
      .find({
        retailerId: { $in: retailerIds },
        humidorId: { $in: humidors.map((humidor) => humidor._id) },
        status: 'active',
        quantity: { $gt: 0 },
        masterCigarId: masterCigarId
          ? new Types.ObjectId(masterCigarId)
          : { $ne: null },
        ...(Object.keys(price).length ? { price } : {}),
      })
      .select(
        'retailerId masterCigarId humidorId wallId wallName shelfId shelfName shelfColumn quantity price pricePerBox',
      )
      .sort({ price: 1, _id: 1 })
      .lean();

    const retailerById = new Map(
      nearbyRetailers.map((retailer) => [String(retailer._id), retailer]),
    );
    const humidorById = new Map(
      humidors.map((humidor) => [String(humidor._id), humidor]),
    );
    const grouped = new Map<
      string,
      NearbyStoreSelection & { masterCigarId: Types.ObjectId }
    >();

    for (const item of inventory) {
      const retailer = retailerById.get(String(item.retailerId));
      const humidor = humidorById.get(String(item.humidorId));
      if (!retailer || !humidor || !item.masterCigarId) continue;
      const groupKey = `${String(item.masterCigarId)}:${String(item.retailerId)}`;
      const current = grouped.get(groupKey);
      if (current) {
        current.store.quantity += item.quantity;
        continue;
      }

      const wall = humidor.walls?.find(
        (entry) => String(entry._id) === String(item.wallId),
      );
      const shelf = wall?.shelves?.find(
        (entry) => String(entry._id) === String(item.shelfId),
      );
      grouped.set(groupKey, {
        masterCigarId: item.masterCigarId,
        store: {
          retailerId: retailer._id,
          storeName: retailer.storeName,
          storeSlug: retailer.storeSlug,
          distance: retailer.distance,
          price: item.price,
          pricePerBox: item.pricePerBox,
          quantity: item.quantity,
        },
        location: {
          humidorId: humidor._id,
          humidor: humidor.name,
          wallId: item.wallId ?? null,
          wall: wall?.name ?? item.wallName ?? null,
          shelfId: item.shelfId ?? null,
          shelf: shelf?.name ?? item.shelfName ?? null,
          column: item.shelfColumn,
        },
      });
    }

    const stocksByCigar = new Map<string, NearbyStoreSelection[]>();
    for (const { masterCigarId: cigarId, ...selection } of grouped.values()) {
      const key = String(cigarId);
      const selections = stocksByCigar.get(key) ?? [];
      selections.push(selection);
      stocksByCigar.set(key, selections);
    }
    for (const selections of stocksByCigar.values()) {
      selections.sort(
        (a, b) =>
          a.store.distance - b.store.distance ||
          a.store.price - b.store.price ||
          String(a.store.retailerId).localeCompare(String(b.store.retailerId)),
      );
    }
    return stocksByCigar;
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
