import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import { CreateMasterDatabaseDto } from './dto/create-master-database.dto';
import { UpdateMasterDatabaseDto } from './dto/update-master-database.dto';
import {
  MasterDatabase,
  MasterDatabaseDocument,
} from './entities/master-database.entity';

@Injectable()
export class MasterDatabaseService {
  constructor(
    @InjectModel(MasterDatabase.name)
    private readonly masterBatabaseModel: Model<MasterDatabaseDocument>,
  ) {}

  async createMasterDatabase(createMasterDatabaseDto: CreateMasterDatabaseDto) {
    const masterDatabase = await this.masterBatabaseModel.create(
      createMasterDatabaseDto,
    );

    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }

  // service
  async uploadBulkMasterDatabase(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      throw new BadRequestException('No sheet found in uploaded file');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });
    if (!rows.length) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const mappedRows = rows
      .map((row) => this.toMasterDatabaseEntry(row))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    if (!mappedRows.length) {
      throw new BadRequestException(
        'No valid rows found. Required columns: name, brand',
      );
    }

    return this.masterBatabaseModel.insertMany(mappedRows);
  }

  private getValue(row: Record<string, unknown>, key: string): string {
    for (const [rowKey, value] of Object.entries(row)) {
      if (rowKey.trim().toLowerCase().replace(/\s+/g, '') === key) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(value ?? '').trim();
      }
    }
    return '';
  }

  private toMasterDatabaseEntry(row: Record<string, unknown>) {
    const name = this.getValue(row, 'name');
    const brand = this.getValue(row, 'brand');
    if (!name || !brand) return null;

    const priceRaw = this.getValue(row, 'price');
    const price = priceRaw ? Number(priceRaw) : undefined;

    return {
      name,
      brand,
      description: this.getValue(row, 'description'),
      manufacturer: this.getValue(row, 'manufacturer'),
      country: this.getValue(row, 'country'),
      price: Number.isFinite(price) ? price : undefined,
      status: 'active',
    };
  }

  async getAllMasterDatabase(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = buildWhereConditions(params, [
      'name',
      'brand',
      'description',
      'manufacturer',
      'country',
      'status',
    ]);

    const result = await this.masterBatabaseModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit).populate('submittedByRetailer');

    const total =
      await this.masterBatabaseModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getMasterDatabaseById(id: string) {
    const masterDatabase = await this.masterBatabaseModel.findById(id);
    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }

  async updateMasterDatabaseById(
    id: string,
    updateMasterDatabaseDto: UpdateMasterDatabaseDto,
  ) {
    const masterDatabase = await this.masterBatabaseModel.findByIdAndUpdate(
      id,
      updateMasterDatabaseDto,
      { new: true },
    );
    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }

  async deleteMasterDatabaseById(id: string) {
    const masterDatabase = await this.masterBatabaseModel.findByIdAndDelete(id);
    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }
}
