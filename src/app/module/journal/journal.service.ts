import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import { ConsumerCigarService } from '../consumer-cigar/consumer-cigar.service';
import {
  MasterDatabase,
  MasterDatabaseDocument,
} from '../master-database/entities/master-database.entity';
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { Journal, JournalDocument } from './entities/journal.entity';

@Injectable()
export class JournalService {
  constructor(
    @InjectModel(Journal.name)
    private readonly journalModel: Model<JournalDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Retailer.name)
    private readonly retailerModel: Model<RetailerDocument>,
    @InjectModel(MasterDatabase.name)
    private readonly masterDatabaseModel: Model<MasterDatabaseDocument>,
    private readonly consumerCigarService: ConsumerCigarService,
  ) {}

  async createJournal(userId: string, createJournalDto: CreateJournalDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const masterDatabase = await this.masterDatabaseModel
      .findOne({
        _id: createJournalDto.cigarId,
        status: 'active',
      })
      .select('_id');
    if (!masterDatabase) {
      throw new NotFoundException('Master database not found');
    }

    if (createJournalDto.retailerId) {
      const retailer = await this.retailerModel.findById(
        createJournalDto.retailerId,
      );
      if (!retailer) {
        throw new NotFoundException('Retailer not found');
      }
    }

    const journal = await this.journalModel.create({
      userId: user._id,
      cigarId: masterDatabase._id,

      retailerId: createJournalDto.retailerId ?? null,

      smokedAt: createJournalDto.smokedAt
        ? new Date(createJournalDto.smokedAt)
        : new Date(),

      rating: createJournalDto.rating,
      notes: createJournalDto.notes?.trim(),

      flavorTags:
        createJournalDto.flavorTags?.map((item) => item.trim().toLowerCase()) ??
        [],

      strengthImpression: createJournalDto.strengthImpression
        ?.trim()
        .toLowerCase(),

      pricePaid: createJournalDto.pricePaid,

      wouldSmokeAgain: createJournalDto.wouldSmokeAgain,
    });

    await this.consumerCigarService.recordJournal(userId, journal);
    return journal;
  }

  async getSingleJournal(userId: string, id: string) {
    const journal = await this.journalModel
      .findOne({ _id: id, userId })
      .populate('userId', 'name email')
      .populate(
        'cigarId',
        'brand productLine name image strength wrapper flavorNotes',
      )
      .populate('retailerId', 'storeName logo address city');
    if (!journal) {
      throw new NotFoundException('Journal not found');
    }
    return journal;
  }

  async updateJournal(userId: string, id: string, dto: UpdateJournalDto) {
    const existing = await this.journalModel.exists({ _id: id, userId });
    if (!existing) {
      throw new NotFoundException('Journal not found');
    }

    const updates: UpdateQuery<Journal> = {};
    if (dto.retailerId !== undefined) {
      if (dto.retailerId !== null) {
        const retailer = await this.retailerModel
          .findById(dto.retailerId)
          .select('_id');
        if (!retailer) {
          throw new NotFoundException('Retailer not found');
        }
        updates.retailerId = retailer._id;
      } else {
        updates.retailerId = null;
      }
    }
    if (dto.smokedAt != null) updates.smokedAt = new Date(dto.smokedAt);
    if (dto.rating != null) updates.rating = dto.rating;
    if (dto.notes != null) updates.notes = dto.notes.trim();
    if (dto.flavorTags != null) {
      updates.flavorTags = dto.flavorTags.map((tag) =>
        tag.trim().toLowerCase(),
      );
    }
    if (dto.strengthImpression != null) {
      updates.strengthImpression = dto.strengthImpression.trim().toLowerCase();
    }
    if (dto.pricePaid != null) updates.pricePaid = dto.pricePaid;
    if (dto.wouldSmokeAgain != null)
      updates.wouldSmokeAgain = dto.wouldSmokeAgain;

    const journal = await this.journalModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!journal) {
      throw new NotFoundException('Journal not found');
    }
    return journal;
  }

  async deleteJournal(userId: string, id: string) {
    const journal = await this.journalModel.findOneAndDelete({
      _id: id,
      userId,
    });
    if (!journal) {
      throw new NotFoundException('Journal not found');
    }
    return journal;
  }

  async getJournals(userId: string, params: IFilterParams, options: IOptions) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenCondition = buildWhereConditions(
      params,
      ['notes', 'flavorTags', 'strengthImpression'],
      {
        userId: user._id,
      },
    );

    const journals = await this.journalModel
      .find({
        ...whenCondition,
      })
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'name email')
      .populate(
        'cigarId',
        'brand productLine name image strength wrapper flavorNotes',
      )
      .populate('retailerId', 'storeName logo address city');

    const total = await this.journalModel.countDocuments({
      ...whenCondition,
    });
    return {
      data: journals,
      meta: { page, limit, total },
    };
  }
}
