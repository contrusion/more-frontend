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
});
