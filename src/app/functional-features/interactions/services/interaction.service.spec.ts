import { of } from 'rxjs';
import { InteractionService } from './interaction.service';

describe('InteractionService', () => {
  it('prefers recruiter-only structured job metadata and ignores candidate replies', (done) => {
    const httpClient = {
      get: jasmine.createSpy('get').and.returnValue(of([
        {
          id: 'thread-structured-job',
          initiatedAt: '2026-10-11T12:00:00Z',
          status: 'ACTIVE',
          recruiter: {
            id: 'recruiter-1',
            firstName: 'Jane',
            lastName: 'Smith',
            companyName: 'Recruiter Co'
          },
          externalRecruiterName: 'Jane Smith',
          externalCompanyName: 'Recruiter Co',
          interactionEventDtos: [
            {
              id: 'event-1',
              type: 'OUTREACH',
              channel: 'EMAIL',
              sentByUser: false,
              messagePreview: 'Hi there, thanks for your profile',
              notes: 'Imported from Gmail | Source: DIRECT_RECRUITER | Job: Senior Java Developer | Company: Best Bank',
              subject: 'Fully remote - up to R1.7m',
              timestamp: '2026-10-11T12:00:00Z'
            },
            {
              id: 'event-2',
              type: 'REPLY',
              channel: 'EMAIL',
              sentByUser: true,
              messagePreview: 'Hi Steven, I have attached my CV. Notice Period: 1 Calendar month',
              notes: 'Hi Steven, I have attached my CV. Notice Period: 1 Calendar month',
              timestamp: '2026-10-12T12:00:00Z'
            }
          ]
        }
      ]))
    } as any;

    const service = new InteractionService(httpClient);

    service.getThreads().subscribe((threads) => {
      expect(threads[0].jobTitle).toBe('Senior Java Developer');
      expect(threads[0].events[0].content).toBe('Hi there, thanks for your profile');
      expect(threads[0].lastEventPreview).toBe('Hi Steven, I have attached my CV. Notice Period: 1 Calendar month');
      done();
    });
  });

  it('maps extracted client opportunities per event and merges them onto the thread', (done) => {
    const facts = (overrides: object) => ({
      skills: [], location: null, workMode: null, salary: null, visaConstraints: null,
      noticePeriod: null, interviewDate: null, dealBreakers: [], ...overrides
    });
    const httpClient = {
      get: jasmine.createSpy('get').and.returnValue(of([
        {
          id: 'thread-opps',
          initiatedAt: '2026-10-11T12:00:00Z',
          status: 'ACTIVE',
          externalRecruiterName: 'Steven',
          externalCompanyName: 'Recruiter Co',
          interactionEventDtos: [
            {
              id: 'event-1', type: 'OUTREACH', channel: 'EMAIL', sentByUser: false, messagePreview: 'Hi',
              timestamp: '2026-10-11T12:00:00Z',
              opportunities: [{
                companyId: 'c1', companyName: 'Best Bank', companyWebsite: null, title: 'Senior Java Developer',
                facts: facts({ skills: ['Java'], dealBreakers: ['On site 3 days'] })
              }]
            },
            {
              id: 'event-2', type: 'FOLLOW_UP', channel: 'EMAIL', sentByUser: false, messagePreview: 'Update',
              timestamp: '2026-10-12T12:00:00Z',
              opportunities: [{
                companyId: 'c1', companyName: 'Best Bank', companyWebsite: 'https://bestbank.co.za',
                title: 'senior java developer', facts: facts({ location: 'Cape Town', skills: ['Spring'] })
              }]
            },
            { id: 'event-3', type: 'REPLY', channel: 'EMAIL', sentByUser: true, messagePreview: 'Thanks', timestamp: '2026-10-13T12:00:00Z' }
          ]
        }
      ]))
    } as any;

    new InteractionService(httpClient).getThreads().subscribe((threads) => {
      expect(threads[0].events[0].opportunities?.[0].companyName).toBe('Best Bank');
      expect(threads[0].events[0].opportunities?.[0].companyWebsite).toBeUndefined();
      expect(threads[0].events[2].opportunities).toEqual([]);

      expect(threads[0].opportunities?.length).toBe(1);
      const merged = threads[0].opportunities![0];
      expect(merged.companyName).toBe('Best Bank');
      expect(merged.companyWebsite).toBe('https://bestbank.co.za');
      expect(merged.facts.location).toBe('Cape Town');
      expect(merged.facts.skills).toEqual(['Java', 'Spring']);
      expect(merged.facts.dealBreakers).toEqual(['On site 3 days']);
      done();
    });
  });

  it('treats a missing or malformed opportunities payload as no opportunities', (done) => {
    const httpClient = {
      get: jasmine.createSpy('get').and.returnValue(of([
        {
          id: 'thread-legacy',
          initiatedAt: '2026-10-11T12:00:00Z',
          status: 'ACTIVE',
          interactionEventDtos: [
            { id: 'e1', type: 'OUTREACH', channel: 'EMAIL', timestamp: '2026-10-11T12:00:00Z' },
            { id: 'e2', type: 'OUTREACH', channel: 'EMAIL', timestamp: '2026-10-12T12:00:00Z', opportunities: 'nope' },
            { id: 'e3', type: 'OUTREACH', channel: 'EMAIL', timestamp: '2026-10-13T12:00:00Z', opportunities: [{ title: '  ', facts: null }] }
          ]
        }
      ]))
    } as any;

    new InteractionService(httpClient).getThreads().subscribe((threads) => {
      expect(threads[0].events[0].opportunities).toEqual([]);
      expect(threads[0].events[1].opportunities).toEqual([]);
      expect(threads[0].events[2].opportunities?.[0].title).toBeUndefined();
      expect(threads[0].events[2].opportunities?.[0].facts.skills).toEqual([]);
      done();
    });
  });
});
