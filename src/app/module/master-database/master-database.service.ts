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
        'No valid rows found. Required columns: Brand, Product Line',
      );
    }

    const inserted = await this.masterBatabaseModel.insertMany(mappedRows, {
      ordered: false,
    });

    return {
      totalRows: rows.length,
      insertedCount: inserted.length,
      skippedCount: rows.length - mappedRows.length,
    };
  }

  private normalizeKey(key: string): string {
    return key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private getValue(row: Record<string, unknown>, ...aliases: string[]): string {
    const wanted = aliases.map((a) => this.normalizeKey(a));
    for (const [rowKey, value] of Object.entries(row)) {
      if (wanted.includes(this.normalizeKey(rowKey))) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(value ?? '').trim();
      }
    }
    return '';
  }

  private parsePrice(raw: string): number | undefined {
    if (!raw) return undefined;
    const cleaned = raw.replace(/[^0-9.-]/g, '');
    if (!cleaned) return undefined;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : undefined;
  }

  private toMasterDatabaseEntry(row: Record<string, unknown>) {
    const productLine = this.getValue(row, 'productLine', 'product line');
    const brand = this.getValue(row, 'brand');
    if (!productLine || !brand) return null;

    const pairingRaw = this.getValue(
      row,
      'pairingSuggestions',
      'pairing suggestions',
    );
    const pairingSuggestions = pairingRaw
      ? pairingRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const eachRaw = this.getValue(
      row,
      'suggestedRetailPriceEach',
      'suggested retail price (each)',
      'price',
    );
    const boxRaw = this.getValue(
      row,
      'suggestedRetailPricePerBox',
      'suggested retail price (box)',
    );

    return {
      productLine,
      brand,
      strength: this.getValue(row, 'strength'),
      wrapper: this.getValue(row, 'wrapper'),
      estimatedSmokingTime: this.getValue(
        row,
        'estimatedSmokingTime',
        'estimated smoking time',
      ),
      pairingSuggestions,
      suggestedRetailPriceEach: this.parsePrice(eachRaw),
      suggestedRetailPricePerBox: this.parsePrice(boxRaw),
      status: 'active',
    };
  }

  async getAllMasterDatabase(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = buildWhereConditions(params, [
      'productLine',
      'brand',
      'strength',
      'wrapper',
      'estimatedSmokingTime',
      'pairingSuggestions',
      'status',
    ]);

    const result = await this.masterBatabaseModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('submittedByRetailer');

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
