import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/infrastructure/auth.service';
import { RecommendationService } from './recommendation-api.service';

describe('RecommendationService — sector/general contract', () => {
  let service: RecommendationService;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecommendationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            user: () => ({ id: 3, role: 'agronomist' }),
          },
        },
      ],
    });
    service = TestBed.inject(RecommendationService);
    http = TestBed.inject(HttpTestingController);
  });

  it('lists sector recommendations', () => {
    let resultLen = -1;
    service.list({ scope: 'sector', sectorId: 1 }).subscribe((res) => {
      resultLen = res.recommendations.length;
      expect(res.recommendations[0].id).toBe(7);
      expect(res.recommendations[0].scopeLabel).toBe('Sector #1');
    });

    const req = http.expectOne(`${api}/sectors/1/recommendations`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 7,
        content: 'Riego',
        type: 'SectorSpecific',
        status: 'Pending',
        createdAt: '2026-07-10T00:00:00Z',
        approvedAt: null,
        publishedAt: null,
      },
    ]);
    expect(resultLen).toBe(1);
  });

  it('lists general recommendations with status filter', () => {
    service.list({ scope: 'general', status: 'published' }).subscribe((res) => {
      expect(res.recommendations[0].type).toBe('General');
      expect(res.recommendations[0].status).toBe('published');
    });

    const req = http.expectOne(
      (r) =>
        r.url === `${api}/recommendations/general` &&
        r.params.get('status') === 'Published',
    );
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 2,
        content: 'General',
        type: 'General',
        status: 'Published',
        createdAt: '2026-07-10T00:00:00Z',
        approvedAt: '2026-07-10T01:00:00Z',
        publishedAt: '2026-07-10T02:00:00Z',
      },
    ]);
  });

  it('creates sector recommendation with agronomistId from auth', () => {
    service
      .create({
        scope: 'sector',
        sectorId: 1,
        title: 'Riego',
        description: 'Aumentar',
        recommendedAction: '',
        priority: 'medium',
      })
      .subscribe((rec) => {
        expect(rec.id).toBe(9);
        expect(rec.status).toBe('pending_review');
      });

    const req = http.expectOne(`${api}/sectors/1/recommendations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.agronomistId).toBe(3);
    expect(req.request.body.content).toContain('Riego');
    req.flush({
      id: 9,
      content: req.request.body.content,
      type: 'SectorSpecific',
      status: 'Pending',
      createdAt: '2026-07-10T00:00:00Z',
      approvedAt: null,
      publishedAt: null,
    });
  });

  it('creates general recommendation', () => {
    service
      .create({
        scope: 'general',
        sectorId: null,
        title: 'Fumigación',
        description: 'Aplicar en finca',
        recommendedAction: '',
        priority: 'low',
      })
      .subscribe((rec) => {
        expect(rec.scopeLabel).toBe('General');
      });

    const req = http.expectOne(`${api}/recommendations/general`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 10,
      content: req.request.body.content,
      type: 'General',
      status: 'Pending',
      createdAt: '2026-07-10T00:00:00Z',
      approvedAt: null,
      publishedAt: null,
    });
  });

  it('gets by id, approves and publishes via /recommendations/{id}', () => {
    service.getById(3).subscribe((rec) => expect(rec.id).toBe(3));
    http.expectOne(`${api}/recommendations/3`).flush({
      id: 3,
      content: 'x',
      type: 'SectorSpecific',
      status: 'Pending',
      createdAt: '2026-07-10T00:00:00Z',
      approvedAt: null,
      publishedAt: null,
    });

    service.approve(3).subscribe((rec) => expect(rec.status).toBe('approved'));
    http.expectOne(`${api}/recommendations/3/approval`).flush({
      id: 3,
      content: 'x',
      type: 'SectorSpecific',
      status: 'Approved',
      createdAt: '2026-07-10T00:00:00Z',
      approvedAt: '2026-07-10T01:00:00Z',
      publishedAt: null,
    });

    service.publish(3).subscribe((rec) => expect(rec.status).toBe('published'));
    http.expectOne(`${api}/recommendations/3/publication`).flush({
      id: 3,
      content: 'x',
      type: 'SectorSpecific',
      status: 'Published',
      createdAt: '2026-07-10T00:00:00Z',
      approvedAt: '2026-07-10T01:00:00Z',
      publishedAt: '2026-07-10T02:00:00Z',
    });
  });
});
