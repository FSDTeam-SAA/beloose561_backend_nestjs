import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { Humidor } from '../humidor/entities/humidor.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { MasterDatabaseDocument } from '../master-database/entities/master-database.entity';
import { MasterDatabaseService } from '../master-database/master-database.service';
import { Retailer } from '../retailer/entities/retailer.entity';

@Injectable()
export class ConsumerScanService {
  constructor(
    private readonly masterDatabaseService: MasterDatabaseService,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<Inventory>,
    @InjectModel(Retailer.name) private readonly retailerModel: Model<Retailer>,
  ) {}

  async scan(code: string, retailerId?: string) {
    if (retailerId !== undefined && !isObjectIdOrHexString(retailerId)) {
      throw new BadRequestException('Invalid retailerId');
    }
    const master = await this.masterDatabaseService.findByUpcCode(code);
    const cigar = this.getCigarDetails(master);
    const store = retailerId
      ? await this.getStoreAvailability(String(master._id), retailerId)
      : null;
    return { cigar, store };
  }

  // UPC scans and cigar detail pages share the same public cigar fields.
  getCigarDetails(master: MasterDatabaseDocument) {
    // Explicit public projection: do not expose submission ownership or admin data.
    return {
      id: master._id,
      brand: master.brand,
      productLine: master.productLine,
      upcCodes: master.upcCodes,
      name: master.name,
      manufacturer: master.manufacturer,
      country: master.country,
      strength: master.strength,
      wrapper: master.wrapper,
      binder: master.binder,
      filler: master.filler,
      size: master.size,
      length: master.length,
      ringGauge: master.ringGauge,
      flavorNotes: master.flavorNotes,
      description: master.description,
      whyYoullLikeThis: master.whyYoullLikeThis,
      image: master.image,
      estimatedSmokingTime: master.estimatedSmokingTime,
      pairingSuggestions: master.pairingSuggestions,
      suggestedRetailPriceEach: master.suggestedRetailPriceEach,
      suggestedRetailPricePerBox: master.suggestedRetailPricePerBox,
    };
  }

  // A store can keep the same cigar in more than one location.
  async getStoreAvailability(cigarId: string, retailerId: string) {
    if (!isObjectIdOrHexString(retailerId)) {
      throw new BadRequestException('Invalid retailerId');
    }
    const retailer = await this.retailerModel
      .findOne({ _id: retailerId, status: 'approved' })
      .select('storeName')
      .lean();
    if (!retailer) throw new NotFoundException('Approved retailer not found');

    const items = await this.inventoryModel
      .find({
        retailerId: new Types.ObjectId(retailerId),
        masterCigarId: new Types.ObjectId(cigarId),
        status: { $in: ['active', 'out_of_stock'] },
      })
      .select(
        'quantity price pricePerBox status humidorId wallId wallName shelfId shelfName shelfColumn',
      )
      .populate<{ humidorId: (Humidor & { _id: Types.ObjectId }) | null }>({
        path: 'humidorId',
        select: 'name walls shelfes',
        match: { retailerId: new Types.ObjectId(retailerId), isActive: true },
      })
      .sort({ _id: 1 })
      .lean();

    const locations = items
      .filter((item) => item.humidorId)
      .map((item) => {
        const humidor = item.humidorId!;
        const wall = humidor.walls?.find(
          (entry) => String(entry._id) === String(item.wallId),
        );
        const shelf = wall?.shelves?.find(
          (entry) => String(entry._id) === String(item.shelfId),
        );
        const available = item.status === 'active' && item.quantity > 0;
        return {
          inventoryId: item._id,
          available,
          quantity: available ? item.quantity : 0,
          price: item.price,
          pricePerBox: item.pricePerBox,
          location: {
            humidorId: humidor._id,
            humidor: humidor.name,
            wallId: item.wallId ?? null,
            wall: wall?.name ?? item.wallName ?? null,
            shelfId: item.shelfId ?? null,
            shelf: shelf?.name ?? item.shelfName ?? null,
            column: item.shelfColumn,
          },
        };
      });
    const primary = locations.find((item) => item.available) ?? locations[0];
    return {
      retailerId: retailer._id,
      storeName: retailer.storeName,
      available: locations.some((item) => item.available),
      quantity: locations.reduce((sum, item) => sum + item.quantity, 0),
      price: primary?.price ?? null,
      pricePerBox: primary?.pricePerBox ?? null,
      location: primary?.location ?? null,
      locations,
    };
  }
}
