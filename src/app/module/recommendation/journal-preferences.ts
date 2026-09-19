import type { Journal } from '../journal/entities/journal.entity';

export interface JournalPreferences {
  flavors: string[];
  strengths: string[];
  repeatCigarIds: string[];
  avoidedCigarIds: string[];
}

// Entries arrive newest smoking session first. Repeated logs of one cigar
// contribute once, so volume alone cannot inflate a recommendation score.
export function getJournalPreferences(
  journals: Pick<
    Journal,
    | 'cigarId'
    | 'rating'
    | 'flavorTags'
    | 'strengthImpression'
    | 'wouldSmokeAgain'
  >[],
): JournalPreferences {
  const flavors = new Set<string>();
  const strengths = new Set<string>();
  const seen = new Set<string>();
  const repeatCigarIds: string[] = [];
  const avoidedCigarIds: string[] = [];
  for (const journal of journals) {
    const id = String(journal.cigarId);
    if (seen.has(id)) continue;
    seen.add(id);
    if (
      journal.wouldSmokeAgain === false ||
      (journal.rating != null && journal.rating <= 2)
    ) {
      avoidedCigarIds.push(id);
      continue;
    }
    // Describing a flavor does not, by itself, mean the customer likes it.
    if (journal.wouldSmokeAgain !== true && (journal.rating ?? 0) < 4) continue;
    if (journal.wouldSmokeAgain === true) repeatCigarIds.push(id);
    for (const tag of journal.flavorTags ?? []) {
      const value = tag.trim().toLowerCase();
      if (value) flavors.add(value);
    }
    const strength = journal.strengthImpression?.trim().toLowerCase();
    if (strength) strengths.add(strength);
  }
  return {
    flavors: [...flavors],
    strengths: [...strengths],
    repeatCigarIds,
    avoidedCigarIds,
  };
}
