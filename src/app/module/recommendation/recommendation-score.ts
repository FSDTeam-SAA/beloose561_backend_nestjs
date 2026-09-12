import { ConsumerProfile } from '../consumer-profile/entities/consumer-profile.entity';
import { MasterDatabase } from '../master-database/entities/master-database.entity';
import { smokingTimeInMinutes } from '../../helpers/smokingTime';

export interface BehaviorPreferences {
  brands: string[];
  strengths: string[];
  searchTerms: string[];
  dislikedCigarIds: string[];
}

function matches(preferences: string[] | undefined, value: string | undefined) {
  if (!value) return false;
  return (
    preferences?.some(
      (item) => item.trim().toLowerCase() === value.trim().toLowerCase(),
    ) ?? false
  );
}

// Keep the scoring rules together so the weights are easy to change.
export function scoreCigar(
  cigar: MasterDatabase & { _id: unknown },
  profile: Partial<ConsumerProfile>,
  price: number | undefined,
  behavior: BehaviorPreferences,
) {
  let score = 0;
  const reasons: string[] = [];
  if (matches(profile.preferredStrengths, cigar.strength)) {
    score += 25;
    reasons.push('Matches your preferred strength');
  }
  if (matches(profile.preferredWrappers, cigar.wrapper)) {
    score += 15;
    reasons.push('Matches your preferred wrapper');
  }
  const flavors = (cigar.flavorNotes ?? []).filter((flavor) =>
    matches(profile.preferredFlavors, flavor),
  );
  if (flavors.length) {
    score += Math.min(
      new Set(flavors.map((flavor) => flavor.toLowerCase())).size * 10,
      20,
    );
    reasons.push(`Matches your flavor preferences: ${flavors.join(', ')}`);
  }
  const hasBudget = profile.minBudget != null || profile.maxBudget != null;
  if (
    hasBudget &&
    price != null &&
    price >= (profile.minBudget ?? 0) &&
    price <= (profile.maxBudget ?? Infinity)
  ) {
    score += 20;
    reasons.push('Within your budget');
  }
  if (matches(profile.favoriteBrands, cigar.brand)) {
    score += 10;
    reasons.push('One of your favorite brands');
  }
  if (matches(profile.preferredOrigins, cigar.country)) {
    score += 5;
    reasons.push('Matches your preferred origin');
  }
  if (
    profile.preferredSmokingTimes?.some((time) => {
      const minutes = smokingTimeInMinutes(time);
      return (
        minutes !== undefined &&
        minutes === smokingTimeInMinutes(cigar.estimatedSmokingTime)
      );
    })
  ) {
    score += 5;
    reasons.push('Matches your preferred smoking time');
  }

  const searchMatch = behavior.searchTerms.some((term) => {
    const text =
      `${cigar.brand} ${cigar.productLine} ${cigar.name ?? ''}`.toLowerCase();
    return term.trim().length >= 2 && text.includes(term.trim().toLowerCase());
  });
  if (
    matches(behavior.brands, cigar.brand) ||
    matches(behavior.strengths, cigar.strength) ||
    searchMatch
  ) {
    score += 5;
    reasons.push('Similar to cigars you have liked or explored');
  }
  if (behavior.dislikedCigarIds.includes(String(cigar._id))) {
    score -= 10;
    reasons.push('Ranked lower because of your previous rating');
  }
  return {
    matchScore: Math.max(0, Math.min(score, 100)),
    matchReasons: reasons,
  };
}
