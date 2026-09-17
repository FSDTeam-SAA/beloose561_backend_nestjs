import { Types } from 'mongoose';
import { getJournalPreferences } from './journal-preferences';
import { BehaviorPreferences, scoreCigar } from './recommendation-score';
import { MasterDatabase } from '../master-database/entities/master-database.entity';

describe('Journal recommendation signals', () => {
  const cigarId = new Types.ObjectId();
  const cigar = {
    _id: cigarId,
    brand: 'Test',
    productLine: 'Classic',
    strength: 'medium',
    flavorNotes: ['cedar', 'coffee'],
  } as MasterDatabase & { _id: Types.ObjectId };
  const base: BehaviorPreferences = {
    brands: [],
    strengths: [],
    searchTerms: [],
    dislikedCigarIds: [],
  };
  const liked = {
    cigarId,
    flavorTags: [' CEDAR ', 'coffee', 'cedar'],
    strengthImpression: ' Medium ',
    wouldSmokeAgain: true,
    rating: 5,
  };

  it('improves matching recommendations after a positive journal and removes the bonus after deletion', () => {
    const before = scoreCigar(cigar, {}, undefined, base);
    const after = scoreCigar(cigar, {}, undefined, {
      ...base,
      journal: getJournalPreferences([liked]),
    });
    expect(after.matchScore).toBe(before.matchScore + 20);
    expect(after.matchReasons).toContain('You would smoke this cigar again');
    const deleted = scoreCigar(cigar, {}, undefined, {
      ...base,
      journal: getJournalPreferences([]),
    });
    expect(deleted).toEqual(before);
  });

  it('uses the newest entry once and does not learn liked flavors from negative feedback', () => {
    const journal = getJournalPreferences([
      { ...liked, wouldSmokeAgain: false },
      liked,
    ]);
    expect(journal.flavors).toEqual([]);
    expect(journal.strengths).toEqual([]);
    expect(journal.avoidedCigarIds).toEqual([String(cigarId)]);
    const result = scoreCigar(
      cigar,
      { preferredStrengths: ['medium'] },
      undefined,
      { ...base, journal },
    );
    expect(result.matchScore).toBe(10);
    expect(getJournalPreferences([liked, liked])).toEqual(
      getJournalPreferences([liked]),
    );
  });

  it('does not assume neutral descriptions are likes and lets low ratings override repeat intent', () => {
    expect(
      getJournalPreferences([{ cigarId, flavorTags: ['cedar'] }]).flavors,
    ).toEqual([]);
    expect(
      getJournalPreferences([{ ...liked, rating: 1 }]).avoidedCigarIds,
    ).toEqual([String(cigarId)]);
  });
});
