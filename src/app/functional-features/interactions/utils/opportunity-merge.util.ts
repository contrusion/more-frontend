import { EventOpportunity, InteractionEvent, OpportunityFacts, ThreadOpportunity } from '../models/interaction.model';

const EMPTY_FACTS: OpportunityFacts = { skills: [], dealBreakers: [] };

function normalise(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function sameCompany(a: EventOpportunity, b: EventOpportunity): boolean {
  if (a.companyId && b.companyId) {
    return a.companyId === b.companyId;
  }
  return normalise(a.companyName) === normalise(b.companyName);
}

function hasCompany(opportunity: EventOpportunity): boolean {
  return !!opportunity.companyId || !!normalise(opportunity.companyName);
}

function compatibleTitles(a: EventOpportunity, b: EventOpportunity): boolean {
  const titleA = normalise(a.title);
  const titleB = normalise(b.title);
  return !titleA || !titleB || titleA === titleB;
}

/**
 * Finds the existing opportunity a new mention belongs to.
 * 1. Same company (or both without a company) and the titles match or one is unknown.
 * 2. Otherwise, when either side names no company (the email stated the role but not the client, or vice versa),
 *    the mention joins an existing opportunity only if exactly one has a compatible title; ambiguity keeps them apart.
 */
function findMatchIndex(merged: ThreadOpportunity[], opportunity: EventOpportunity): number {
  const strict = merged.findIndex(existing => sameCompany(existing, opportunity) && compatibleTitles(existing, opportunity));
  if (strict >= 0) {
    return strict;
  }

  const candidates = merged
    .map((existing, index) => ({ existing, index }))
    .filter(({ existing }) =>
      (!hasCompany(existing) || !hasCompany(opportunity)) && compatibleTitles(existing, opportunity)
    );
  return candidates.length === 1 ? candidates[0].index : -1;
}

function union(older: string[], newer: string[]): string[] {
  const seen = new Set<string>();
  return [...older, ...newer].filter(item => {
    const key = normalise(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/** A newer value wins, but a newer null/blank never erases what an earlier email stated. */
function newer(older: string | undefined, latest: string | undefined): string | undefined {
  return latest && latest.trim() ? latest : older;
}

function mergeFacts(older: OpportunityFacts, latest: OpportunityFacts): OpportunityFacts {
  return {
    skills: union(older.skills, latest.skills),
    location: newer(older.location, latest.location),
    workMode: newer(older.workMode, latest.workMode),
    salary: newer(older.salary, latest.salary),
    visaConstraints: newer(older.visaConstraints, latest.visaConstraints),
    noticePeriod: newer(older.noticePeriod, latest.noticePeriod),
    interviewDate: newer(older.interviewDate, latest.interviewDate),
    dealBreakers: union(older.dealBreakers, latest.dealBreakers)
  };
}

function mergeInto(existing: ThreadOpportunity, latest: EventOpportunity, seen: Date): ThreadOpportunity {
  return {
    companyId: newer(existing.companyId, latest.companyId),
    companyName: newer(existing.companyName, latest.companyName),
    companyWebsite: newer(existing.companyWebsite, latest.companyWebsite),
    title: newer(existing.title, latest.title),
    facts: mergeFacts(existing.facts, latest.facts ?? EMPTY_FACTS),
    lastSeen: seen
  };
}

/**
 * Collapses the per-email opportunities of a thread into its distinct opportunities,
 * most recently mentioned first. Events are applied oldest to newest so later emails refine earlier ones.
 */
export function mergeOpportunities(events: InteractionEvent[]): ThreadOpportunity[] {
  const merged: ThreadOpportunity[] = [];

  const chronological = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  for (const event of chronological) {
    for (const opportunity of event.opportunities ?? []) {
      const index = findMatchIndex(merged, opportunity);
      if (index >= 0) {
        merged[index] = mergeInto(merged[index], opportunity, event.timestamp);
      } else {
        merged.push({ ...opportunity, facts: opportunity.facts ?? EMPTY_FACTS, lastSeen: event.timestamp });
      }
    }
  }

  return merged.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
}
