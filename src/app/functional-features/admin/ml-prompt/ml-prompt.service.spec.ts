import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MlPromptService } from './ml-prompt.service';
import { environment } from '../../../../environments/environment';

describe('MlPromptService', () => {
  let service: MlPromptService;
  let http: HttpTestingController;
  const prompt = `${environment.apiUrl}/api/v1/admin/ml/prompt`;
  const unknown = `${environment.apiUrl}/api/v1/admin/ml/unknown-classifications`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MlPromptService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function expectCall(method: string, url: string, body?: unknown) {
    const req = http.expectOne(url);
    expect(req.request.method).toBe(method);
    if (body !== undefined) {
      expect(req.request.body).toEqual(body);
    }
    req.flush(null);
  }

  it('reads the draft, status and preview', () => {
    service.getDraft().subscribe();
    expectCall('GET', `${prompt}/draft`);
    service.getStatus().subscribe();
    expectCall('GET', `${prompt}/status`);
    service.getPreview().subscribe();
    expectCall('GET', `${prompt}/preview`);
  });

  it('updates sections and manages items', () => {
    service.updateSection('RULES', { heading: 'h', intro: null }).subscribe();
    expectCall('PUT', `${prompt}/sections/RULES`, { heading: 'h', intro: null });
    service.addItem('RULES', { title: null, content: 'c', active: true }).subscribe();
    expectCall('POST', `${prompt}/sections/RULES/items`, { title: null, content: 'c', active: true });
    service.updateItem('i1', { title: 't', content: 'c', active: false }).subscribe();
    expectCall('PUT', `${prompt}/items/i1`);
    service.deleteItem('i1').subscribe();
    expectCall('DELETE', `${prompt}/items/i1`);
    service.reorderItems('RULES', ['b', 'a']).subscribe();
    expectCall('PUT', `${prompt}/sections/RULES/items/order`, { ids: ['b', 'a'] });
  });

  it('manages groups', () => {
    service.createGroup({ name: 'g', intro: null }).subscribe();
    expectCall('POST', `${prompt}/groups`, { name: 'g', intro: null });
    service.updateGroup('g1', { name: 'g', intro: 'x' }).subscribe();
    expectCall('PUT', `${prompt}/groups/g1`);
    service.deleteGroup('g1').subscribe();
    expectCall('DELETE', `${prompt}/groups/g1`);
    service.reorderGroups(['g2', 'g1']).subscribe();
    expectCall('PUT', `${prompt}/groups/order`, { ids: ['g2', 'g1'] });
    service.reorderLabelsInGroup('g1', ['b', 'a']).subscribe();
    expectCall('PUT', `${prompt}/groups/g1/labels/order`, { ids: ['b', 'a'] });
  });

  it('manages labels and the hierarchy', () => {
    const request = { name: 'CV_REQUEST', displayName: 'CV', groupId: 'g1', definition: 'd', active: true, aliases: [] };
    service.createLabel(request).subscribe();
    expectCall('POST', `${prompt}/labels`, request);
    service.updateLabel('l1', request).subscribe();
    expectCall('PUT', `${prompt}/labels/l1`, request);
    service.deleteLabel('l1').subscribe();
    expectCall('DELETE', `${prompt}/labels/l1`);
    service.reorderHierarchy(['b', 'a']).subscribe();
    expectCall('PUT', `${prompt}/labels/hierarchy`, { ids: ['b', 'a'] });
  });

  it('publishes and manages versions', () => {
    service.publish('note').subscribe();
    expectCall('POST', `${prompt}/publish`, { note: 'note' });
    service.getVersions().subscribe();
    expectCall('GET', `${prompt}/versions`);
    service.getVersion(3).subscribe();
    expectCall('GET', `${prompt}/versions/3`);
    service.restoreToDraft(3).subscribe();
    expectCall('POST', `${prompt}/versions/3/restore-to-draft`);
  });

  it('lists unrecognised classifications with and without a status filter', () => {
    service.getUnknownClassifications('NEW', 2, 10).subscribe();
    const filtered = http.expectOne(request => request.url === unknown);
    expect(filtered.request.params.get('status')).toBe('NEW');
    expect(filtered.request.params.get('page')).toBe('2');
    expect(filtered.request.params.get('size')).toBe('10');
    filtered.flush(null);

    service.getUnknownClassifications(null).subscribe();
    const all = http.expectOne(request => request.url === unknown);
    expect(all.request.params.has('status')).toBeFalse();
    expect(all.request.params.get('size')).toBe('20');
    all.flush(null);
  });

  it('updates the status of an unrecognised classification', () => {
    service.updateUnknownStatus('u1', 'REVIEWED').subscribe();
    expectCall('PATCH', `${unknown}/u1/status`, { status: 'REVIEWED' });
  });

  it('keeps the unreviewed count current when the summary is read', () => {
    expect(service.unreviewedCount()).toBe(0);

    service.getUnknownSummary().subscribe();
    http.expectOne(`${unknown}/summary`).flush({ unreviewedCount: 5 });

    expect(service.unreviewedCount()).toBe(5);
  });
});
