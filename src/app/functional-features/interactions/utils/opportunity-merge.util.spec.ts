import { ChannelType, EventOpportunity, EventType, InteractionEvent } from '../models/interaction.model';
import { mergeOpportunities } from './opportunity-merge.util';

describe('mergeOpportunities', () => {
  const opportunity = (overrides: Partial<EventOpportunity> = {}, facts: Partial<EventOpportunity['facts']> = {}): EventOpportunity => ({
    companyId: 'c1',
    companyName: 'Best Bank',
    title: 'Senior Java Developer',
    facts: { skills: [], dealBreakers: [], ...facts },
    ...overrides
  });

  const event = (id: string, day: number, opportunities?: EventOpportunity[]): InteractionEvent => ({
    id,
    interactionThreadId: 't1',
    eventType: EventType.OUTREACH,
    channel: ChannelType.EMAIL,
    content: '',
    timestamp: new Date(Date.UTC(2026, 9, day)),
    senderId: 'r',
    senderName: 'Recruiter',
    opportunities
  });

  it('returns nothing when no event carries an opportunity', () => {
    expect(mergeOpportunities([event('e1', 1), event('e2', 2, [])])).toEqual([]);
  });

  it('merges repeat mentions of the same opportunity regardless of title casing', () => {
    const merged = mergeOpportunities([
      event('e1', 1, [opportunity()]),
      event('e2', 2, [opportunity({ title: ' senior JAVA developer ' })])
    ]);

    expect(merged.length).toBe(1);
    expect(merged[0].lastSeen).toEqual(new Date(Date.UTC(2026, 9, 2)));
  });

  it('never lets a newer null erase an earlier fact, while newer values win', () => {
    const merged = mergeOpportunities([
      event('e2', 2, [opportunity({}, { salary: 'R1.2m', location: 'Johannesburg' })]),
      event('e1', 1, [opportunity({}, { salary: 'R900k', noticePeriod: '1 month' })]),
      event('e3', 3, [opportunity({ companyWebsite: undefined }, { salary: undefined, noticePeriod: '' })])
    ]);

    expect(merged[0].facts.salary).toBe('R1.2m');
    expect(merged[0].facts.location).toBe('Johannesburg');
    expect(merged[0].facts.noticePeriod).toBe('1 month');
  });

  it('unions skills and deal breakers without case-insensitive duplicates or blanks', () => {
    const merged = mergeOpportunities([
      event('e1', 1, [opportunity({}, { skills: ['Java', 'Spring'], dealBreakers: ['On site'] })]),
      event('e2', 2, [opportunity({}, { skills: ['java', ' ', 'Kafka'], dealBreakers: ['ON SITE', 'No visa'] })])
    ]);

    expect(merged[0].facts.skills).toEqual(['Java', 'Spring', 'Kafka']);
    expect(merged[0].facts.dealBreakers).toEqual(['On site', 'No visa']);
  });

  it('treats a company-only mention as the same opportunity and adopts the later title', () => {
    const merged = mergeOpportunities([
      event('e1', 1, [opportunity({ title: undefined })]),
      event('e2', 2, [opportunity({ title: 'Java Developer' })])
    ]);

    expect(merged.length).toBe(1);
    expect(merged[0].title).toBe('Java Developer');
  });

  it('keeps different titles at the same company, or the same title at another company, apart', () => {
    const merged = mergeOpportunities([
      event('e1', 1, [opportunity()]),
      event('e2', 2, [opportunity({ title: 'Data Engineer' })]),
      event('e3', 3, [opportunity({ companyId: 'c2', companyName: 'Other Corp' })])
    ]);

    expect(merged.length).toBe(3);
  });

  it('matches companies by name when no id was resolved', () => {
    const merged = mergeOpportunities([
      event('e1', 1, [opportunity({ companyId: undefined, companyName: 'Best Bank' })]),
      event('e2', 2, [opportunity({ companyId: undefined, companyName: ' best bank ' })])
    ]);

    expect(merged.length).toBe(1);
  });

  it('folds a role stated without a client into the same role once the client is named', () => {
    const merged = mergeOpportunities([
      event('e1', 1, [opportunity({ companyId: undefined, companyName: undefined, title: 'Senior Software Engineer (Java)' })]),
      event('e2', 2, [opportunity({ title: 'Senior Software Engineer (Java)' })])
    ]);

    expect(merged.length).toBe(1);
    expect(merged[0].companyName).toBe('Best Bank');
  });

  it('keeps a company-less role apart from a named company when the titles differ', () => {
    const merged = mergeOpportunities([
      event('e1', 1, [opportunity({ companyId: undefined, companyName: undefined, title: 'Software Engineer' })]),
      event('e2', 2, [opportunity({ title: 'Senior Software Engineer (Scala)' })])
    ]);

    expect(merged.length).toBe(2);
  });

  it('does not guess when a company-less mention could belong to several opportunities', () => {
    const merged = mergeOpportunities([
      event('e1', 1, [opportunity({ title: undefined })]),
      event('e2', 2, [opportunity({ companyId: 'c2', companyName: 'Other Corp', title: undefined })]),
      event('e3', 3, [opportunity({ companyId: undefined, companyName: undefined, title: 'Senior Java Engineer' })])
    ]);

    expect(merged.length).toBe(3);
  });

  it('merges a company-less mention into the single compatible opportunity', () => {
    const merged = mergeOpportunities([
      event('e1', 1, [opportunity({ title: undefined })]),
      event('e2', 2, [opportunity({ companyId: undefined, companyName: undefined, title: 'Senior Java Engineer' }, { noticePeriod: '1 month' })])
    ]);

    expect(merged.length).toBe(1);
    expect(merged[0].title).toBe('Senior Java Engineer');
    expect(merged[0].companyName).toBe('Best Bank');
    expect(merged[0].facts.noticePeriod).toBe('1 month');
  });

  it('lists the most recently mentioned opportunity first, whatever order the events arrive in', () => {
    const merged = mergeOpportunities([
      event('e3', 3, [opportunity({ title: 'Data Engineer' })]),
      event('e1', 1, [opportunity({ title: 'Java Developer' })]),
      event('e2', 2, [opportunity({ companyId: 'c2', companyName: 'Other Corp', title: 'Tester' })])
    ]);

    expect(merged.map(item => item.title)).toEqual(['Data Engineer', 'Tester', 'Java Developer']);
  });

  it('tolerates opportunities without facts', () => {
    const noFacts = { companyId: 'c1', companyName: 'Best Bank', title: 'Dev' } as unknown as EventOpportunity;

    const merged = mergeOpportunities([event('e1', 1, [noFacts]), event('e2', 2, [noFacts])]);

    expect(merged[0].facts.skills).toEqual([]);
    expect(merged[0].facts.dealBreakers).toEqual([]);
  });
});
