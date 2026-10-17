import { EventType } from '../models/interaction.model';
import { ACTIVITY_GROUPS, resolveActivityGroup } from './activity-group.util';

describe('activity-group.util', () => {
  it('assigns every event type to exactly one group', () => {
    Object.values(EventType).forEach(type => {
      const owners = ACTIVITY_GROUPS.filter(group => group.eventTypes.includes(type));
      expect(owners.length).withContext(type).toBe(1);
    });
  });

  it('resolves related event types to the same group', () => {
    expect(resolveActivityGroup([EventType.COMPENSATION_INQUIRY]).id).toBe('screening');
    expect(resolveActivityGroup([EventType.LOCATION_INQUIRY]).id).toBe('screening');
    expect(resolveActivityGroup([EventType.CV_REQUEST]).id).toBe('screening');
    expect(resolveActivityGroup([EventType.CV_SUBMITTED]).id).toBe('screening');
    expect(resolveActivityGroup([EventType.JOB_SPEC_ATTACHED]).id).toBe('screening');
    expect(resolveActivityGroup([EventType.INTERVIEW_INVITE]).id).toBe('interview');
    expect(resolveActivityGroup([EventType.SCREENING_ASSESSMENT_REQUEST]).id).toBe('interview');
  });

  it('prefers the highest-precedence group when several signals are present', () => {
    expect(resolveActivityGroup([EventType.INTERVIEW_SCHEDULED, EventType.COMPENSATION_BOTTLENECK]).id).toBe('attention');
    expect(resolveActivityGroup([EventType.OUTREACH, EventType.REJECTION]).id).toBe('closed');
  });

  it('falls back to outreach when there are no signals', () => {
    expect(resolveActivityGroup([undefined]).id).toBe('outreach');
    expect(resolveActivityGroup([]).id).toBe('outreach');
  });
});
