import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConsumerProfileService } from '../consumer-profile/consumer-profile.service';
import { ConsumerCigarService } from '../consumer-cigar/consumer-cigar.service';
import { ConsumerActivityService } from '../consumer-activity/consumer-activity.service';
import { ConsumerCatalogService } from '../consumer-catalog/consumer-catalog.service';
import { ConsumerScanService } from '../consumer-scan/consumer-scan.service';
import { CatalogQueryDto } from '../consumer-catalog/dto/catalog-query.dto';
import { MasterDatabase } from '../master-database/entities/master-database.entity';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import { BehaviorPreferences, scoreCigar } from './recommendation-score';
import { Journal } from '../journal/entities/journal.entity';
import { getJournalPreferences } from './journal-preferences';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly profileService: ConsumerProfileService,
    private readonly userCigarService: ConsumerCigarService,
    private readonly activityService: ConsumerActivityService,
    private readonly catalogService: ConsumerCatalogService,
    private readonly scanService: ConsumerScanService,
    @InjectModel(MasterDatabase.name)
    private readonly masterModel: Model<MasterDatabase>,
    @InjectModel(Journal.name)
    private readonly journalModel: Model<Journal>,
  ) {}

  async getRecommendations(userId: string, query: RecommendationQueryDto) {
    const profile = await this.profileService.getMyProfile(userId);
    const behavior = await this.getBehaviorPreferences(userId);
    const catalogQuery = new CatalogQueryDto();
    catalogQuery.retailerId = query.retailerId;
    const { cigars, inventory } =
      await this.catalogService.getCandidates(catalogQuery);

    const ranked = cigars.map((cigar) => {
      const stock = inventory.find(
        (item) => String(item.masterCigarId) === String(cigar._id),
      );
      const price = stock?.price ?? cigar.suggestedRetailPriceEach;
      return { cigar, ...scoreCigar(cigar, profile ?? {}, price, behavior) };
    });
    ranked.sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        String(a.cigar._id).localeCompare(String(b.cigar._id)),
    );

    const data: Record<string, unknown>[] = [];
    for (const item of ranked.slice(0, query.limit)) {
      const cigarId = String(item.cigar._id);
      const store = query.retailerId
        ? await this.scanService.getStoreAvailability(cigarId, query.retailerId)
        : null;
      // Stock may change between candidate selection and the final lookup.
      if (query.retailerId && !store?.available) continue;
      data.push({
        ...this.scanService.getCigarDetails(item.cigar),
        cigarId,
        matchScore: item.matchScore,
        matchReasons: item.matchReasons,
        available: store?.available ?? null,
        price: store?.price ?? item.cigar.suggestedRetailPriceEach ?? null,
        quantity: store?.quantity ?? null,
        location: store?.location ?? null,
        store,
      });
    }
    return {
      data,
      meta: { onboardingCompleted: profile?.onboardingCompleted ?? false },
    };
  }

  private async getBehaviorPreferences(
    userId: string,
  ): Promise<BehaviorPreferences> {
    const states = await this.userCigarService.getAllUserStates(userId);
    const activity = await this.activityService.getRecentActivity(userId);
    // Read live entries so edits/deletions affect journal signals immediately.
    const journals = await this.journalModel
      .find({ userId })
      .sort({ smokedAt: -1, _id: -1 })
      .limit(100)
      .select('cigarId rating flavorTags strengthImpression wouldSmokeAgain')
      .lean();
    const journalPreferences = getJournalPreferences(journals);
    const dislikedIds = states
      .filter((state) => state.rating != null && state.rating <= 2)
      .map((state) => String(state.cigarId));
    const likedIds = states
      .filter(
        (state) =>
          state.isFavorite ||
          state.wantToTry ||
          state.hasSmoked ||
          (state.rating ?? 0) >= 4,
      )
      .map((state) => String(state.cigarId));
    const exploredIds = activity
      .filter(
        (event) => ['scan_upc', 'view'].includes(event.type) && event.cigarId,
      )
      .map((event) => String(event.cigarId));
    // Current state wins: an unfavorite or changed rating is reflected immediately.
    const cigarIds = [...new Set([...likedIds, ...exploredIds])].filter(
      (id) =>
        !dislikedIds.includes(id) &&
        !journalPreferences.avoidedCigarIds.includes(id),
    );
    const cigars = await this.masterModel
      .find({ _id: { $in: cigarIds }, status: 'active' })
      .select('brand strength')
      .lean();
    return {
      brands: cigars.map((cigar) => cigar.brand),
      strengths: cigars
        .map((cigar) => cigar.strength)
        .filter((value): value is string => Boolean(value)),
      searchTerms: activity
        .filter((event) => event.type === 'search' && event.searchTerm)
        .map((event) => event.searchTerm!),
      dislikedCigarIds: dislikedIds,
      journal: journalPreferences,
    };
  }
}
