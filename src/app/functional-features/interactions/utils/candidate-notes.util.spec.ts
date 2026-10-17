import { EventType, OpportunityFacts } from '../models/interaction.model';
import { buildCandidateNotes, CandidateNoteInput } from './candidate-notes.util';

describe('buildCandidateNotes actions', () => {
  const now = new Date(2026, 9, 17, 12);
  const facts = (interviewDate?: string, extra: Partial<OpportunityFacts> = {}): OpportunityFacts => ({ skills: [], dealBreakers: [], interviewDate, ...extra });
  const build = (overrides: Partial<CandidateNoteInput> = {}) =>
    buildCandidateNotes({ stage: 'Contacted', signals: [EventType.OUTREACH], facts: [], daysSinceLastEvent: 1, now, unsuccessful: false, ...overrides });
  const actionOf = (notes: ReturnType<typeof build>, title: string) => notes.find(note => note.title === title)?.action?.id;

  it('offers Send CV when a CV was requested', () => {
    expect(actionOf(build({ stage: 'Qualified', signals: [EventType.CV_REQUEST] }), 'CV requested')).toBe('send-cv');
  });

  it('offers calendar and feedback actions depending on the interview date', () => {
    const future = build({ stage: 'Interviewing', signals: [EventType.INTERVIEW_SCHEDULED], facts: [facts('2026-10-25')] });
    const past = build({ stage: 'Interviewing', signals: [EventType.INTERVIEW_SCHEDULED], facts: [facts('2026-10-10')] });
    const noDate = build({ stage: 'Interviewing', signals: [EventType.INTERVIEW_SCHEDULED] });

    expect(actionOf(future, 'Interview date')).toBe('add-to-calendar');
    expect(actionOf(past, 'Interview date passed')).toBe('request-feedback');
    expect(actionOf(noDate, 'Interview scheduled')).toBe('confirm-interview-date');
  });

  it('offers actions for waiting, friction and deal-breaker notes', () => {
    const notes = build({
      stage: 'Interviewing',
      signals: [EventType.SCREENING_ASSESSMENT_REQUEST, EventType.INTERVIEW_TIME_PROPOSED_REJECTED],
      facts: [facts(undefined, { dealBreakers: ['On-site only'] })]
    });

    expect(actionOf(notes, 'Assessment pending')).toBe('plan-assessment');
    expect(actionOf(notes, 'Interview time rejected')).toBe('suggest-interview-times');
    expect(actionOf(notes, 'Deal breaker stated')).toBe('confirm-deal-breakers');
  });

  it('offers a follow-up action for stale threads', () => {
    expect(actionOf(build({ daysSinceLastEvent: 9 }), 'No movement')).toBe('send-follow-up');
  });

  it('offers a preparation action for each upcoming stage', () => {
    expect(actionOf(build(), 'Screening next')).toBe('prepare-screening-answers');
    expect(build({ stage: 'Qualified', signals: [EventType.INTERESTED] }).find(note => note.title === 'Interviews likely next')?.action).toBeUndefined();
    expect(actionOf(build({ stage: 'Interviewing', signals: [EventType.INTERVIEW_TIME_ACCEPTED] }), 'If an offer follows')).toBe('prepare-offer-targets');
    expect(actionOf(build({ stage: 'Decision', signals: [EventType.REJECTION], unsuccessful: true }), 'Ask for feedback')).toBe('request-feedback');
  });

  it('does not attach actions to informational notes', () => {
    const notes = build({ stage: 'Decision', signals: [EventType.NOT_INTERESTED], unsuccessful: true });
    const terms = build({ stage: 'Qualified', signals: [EventType.INTERESTED], facts: [facts(undefined, { salary: 'R1m' })] });

    expect(notes.find(note => note.title === 'Door still open')?.action).toBeUndefined();
    expect(terms.find(note => note.title === 'Stated terms')?.action).toBeUndefined();
  });
});

describe('buildCandidateNotes', () => {
  const now = new Date(2026, 9, 17, 12);
  const emptyFacts = (overrides: Partial<OpportunityFacts> = {}): OpportunityFacts => ({ skills: [], dealBreakers: [], ...overrides });

  const build = (overrides: Partial<CandidateNoteInput> = {}) =>
    buildCandidateNotes({
      stage: 'Contacted',
      signals: [EventType.OUTREACH],
      facts: [],
      daysSinceLastEvent: 1,
      now,
      unsuccessful: false,
      ...overrides
    });

  it('shows a future interview date as success', () => {
    const notes = build({ stage: 'Interviewing', signals: [EventType.INTERVIEW_SCHEDULED], facts: [emptyFacts({ interviewDate: '2026-10-25' })] });

    expect(notes[0].title).toBe('Interview date');
    expect(notes[0].tone).toBe('success');
  });

  it('shows a past interview date as danger', () => {
    const notes = build({ stage: 'Interviewing', signals: [EventType.INTERVIEW_SCHEDULED], facts: [emptyFacts({ interviewDate: '2026-10-10' })] });

    expect(notes[0].title).toBe('Interview date passed');
    expect(notes[0].tone).toBe('danger');
  });

  it('shows an unparseable interview date as neutral raw text', () => {
    const notes = build({ stage: 'Interviewing', signals: [EventType.INTERVIEW_INVITE], facts: [emptyFacts({ interviewDate: 'sometime next week' })] });

    expect(notes[0]).toEqual(jasmine.objectContaining({ tone: 'neutral', detail: 'sometime next week' }));
  });

  it('asks for a date when an interview is scheduled without one', () => {
    const notes = build({ stage: 'Interviewing', signals: [EventType.INTERVIEW_SCHEDULED] });

    expect(notes[0]).toEqual(jasmine.objectContaining({ title: 'Interview scheduled', tone: 'warning' }));
  });

  it('flags pending CV, assessment and rejected interview time for the current stage', () => {
    const notes = build({
      stage: 'Interviewing',
      signals: [EventType.CV_REQUEST, EventType.SCREENING_ASSESSMENT_REQUEST, EventType.INTERVIEW_TIME_PROPOSED_REJECTED]
    });
    const titles = notes.map(note => note.title);

    expect(titles).toContain('CV requested');
    expect(titles).toContain('Assessment pending');
    expect(titles).toContain('Interview time rejected');
  });

  it('does not flag a CV request once the CV was submitted', () => {
    const notes = build({ stage: 'Qualified', signals: [EventType.CV_REQUEST, EventType.CV_SUBMITTED] });

    expect(notes.map(note => note.title)).not.toContain('CV requested');
  });

  it('does not repeat recruiter questions or open interview timing already covered by Next unlock', () => {
    const notes = build({
      stage: 'Interviewing',
      signals: [EventType.COMPENSATION_INQUIRY, EventType.NOTICE_PERIOD_INQUIRY, EventType.INTERVIEW_TIME_PROPOSED]
    });
    const titles = notes.map(note => note.title);

    expect(titles).not.toContain('Questions to answer');
    expect(titles).not.toContain('Interview time open');
  });

  it('warns about stale threads and deal breakers', () => {
    const notes = build({
      stage: 'Qualified',
      signals: [EventType.INTERESTED],
      daysSinceLastEvent: 9,
      facts: [emptyFacts({ dealBreakers: ['On-site only', 'on-site only', 'No visa'] })]
    });
    const titles = notes.map(note => note.title);

    expect(titles).toContain('No movement');
    expect(titles).toContain('2 deal breakers stated');
  });

  it('adds an upcoming-stage note matching the current stage', () => {
    const contacted = build();
    const interviewing = build({ stage: 'Interviewing', signals: [EventType.INTERVIEW_TIME_ACCEPTED] });

    expect(contacted.find(note => note.horizon === 'ahead')?.title).toBe('Screening next');
    expect(interviewing.find(note => note.horizon === 'ahead')?.title).toBe('If an offer follows');
  });

  it('limits the number of notes and drops informational notes first', () => {
    const notes = build({
      stage: 'Interviewing',
      signals: [
        EventType.CV_REQUEST,
        EventType.SCREENING_ASSESSMENT_REQUEST,
        EventType.INTERVIEW_TIME_PROPOSED_REJECTED,
        EventType.LOCATION_BOTTLENECK,
        EventType.COMPENSATION_BOTTLENECK
      ],
      daysSinceLastEvent: 10,
      facts: [emptyFacts({ salary: 'R1m', dealBreakers: ['x'] })]
    });
    const titles = notes.map(note => note.title);

    expect(notes.length).toBe(6);
    expect(notes.every(note => note.tone === 'warning')).toBeTrue();
    expect(titles).not.toContain('Stated terms');
    expect(titles).not.toContain('If an offer follows');
  });

  it('turns bottleneck signals into blocker notes with actions', () => {
    const notes = build({
      stage: 'Qualified',
      signals: [EventType.LOCATION_BOTTLENECK, EventType.COMPENSATION_BOTTLENECK, EventType.SCREENING_ASSESSMENT_FAILED]
    });
    const byTitle = (title: string) => notes.find(note => note.title === title);

    expect(byTitle('Location is blocking')?.action?.id).toBe('clarify-location');
    expect(byTitle('Compensation not aligned')?.action?.id).toBe('clarify-compensation');
    expect(byTitle('Screening not passed')).toEqual(jasmine.objectContaining({ tone: 'danger' }));
    expect(byTitle('Screening not passed')?.action?.id).toBe('request-feedback');
  });

  it('does not flag a bottleneck that was later resolved', () => {
    const notes = build({
      stage: 'Qualified',
      signals: [
        EventType.LOCATION_BOTTLENECK,
        EventType.LOCATION_NEEDS_MET,
        EventType.COMPENSATION_BOTTLENECK,
        EventType.COMPENSATION_NEEDS_MET,
        EventType.SCREENING_ASSESSMENT_FAILED,
        EventType.SCREENING_ASSESSMENT_PASSED
      ]
    });
    const titles = notes.map(note => note.title);

    expect(titles).not.toContain('Location is blocking');
    expect(titles).not.toContain('Compensation not aligned');
    expect(titles).not.toContain('Screening not passed');
  });

  it('orders notes by severity so blockers come before informational notes', () => {
    const notes = build({
      stage: 'Qualified',
      signals: [EventType.INTERESTED, EventType.LOCATION_BOTTLENECK, EventType.SCREENING_ASSESSMENT_FAILED],
      facts: [emptyFacts({ salary: 'R1m' })]
    });

    expect(notes.map(note => note.tone)).toEqual(['danger', 'warning', 'neutral', 'neutral']);
  });

  it('suggests asking for feedback after a rejection and leaving the door open after not interested', () => {
    const rejected = build({ stage: 'Decision', signals: [EventType.REJECTION], unsuccessful: true });
    const declined = build({ stage: 'Decision', signals: [EventType.NOT_INTERESTED], unsuccessful: true });

    expect(rejected[0].title).toBe('Ask for feedback');
    expect(declined[0].title).toBe('Door still open');
  });
});
