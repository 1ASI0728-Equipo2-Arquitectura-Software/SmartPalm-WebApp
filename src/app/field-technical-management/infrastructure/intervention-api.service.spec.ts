import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { InterventionApiService } from './intervention-api.service';

describe('InterventionApiService — FTM contract', () => {
  let service: InterventionApiService;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InterventionApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InterventionApiService);
    http = TestBed.inject(HttpTestingController);
  });

  it('lists interventions by sector', () => {
    let count = -1;
    service.listBySector(1).subscribe((rows) => {
      count = rows.length;
      expect(rows[0].id).toBe(8);
      expect(rows[0].recommendationId).toBe(9);
    });

    const req = http.expectOne(`${api}/sectors/1/interventions`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 8,
        sectorId: 1,
        performedBy: 'Operador',
        description: 'Riego',
        executionDate: '2026-07-10T17:00:00Z',
        createdAt: '2026-07-10T10:00:00Z',
        recommendationId: 9,
      },
    ]);
    expect(count).toBe(1);
  });

  it('creates intervention without recommendation', () => {
    service
      .create(1, {
        description: 'Fumigacion',
        performedBy: 'Tecnico',
        executionDate: '2026-07-10T15:00:00Z',
        originRecommendationId: null,
      })
      .subscribe((row) => {
        expect(row.id).toBe(7);
        expect(row.recommendationId).toBeNull();
      });

    const req = http.expectOne(`${api}/sectors/1/interventions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.originRecommendationId).toBeNull();
    expect(req.request.body.description).toBe('Fumigacion');
    req.flush({
      id: 7,
      sectorId: 1,
      performedBy: 'Tecnico',
      description: 'Fumigacion',
      executionDate: '2026-07-10T15:00:00Z',
      createdAt: '2026-07-10T10:00:00Z',
      recommendationId: null,
    });
  });

  it('creates intervention with published originRecommendationId', () => {
    service
      .create(1, {
        description: 'Desde rec',
        performedBy: 'Campo',
        executionDate: '2026-07-10T16:00:00Z',
        originRecommendationId: 9,
      })
      .subscribe((row) => {
        expect(row.recommendationId).toBe(9);
      });

    const req = http.expectOne(`${api}/sectors/1/interventions`);
    expect(req.request.body.originRecommendationId).toBe(9);
    req.flush({
      id: 10,
      sectorId: 1,
      performedBy: 'Campo',
      description: 'Desde rec',
      executionDate: '2026-07-10T16:00:00Z',
      createdAt: '2026-07-10T10:00:00Z',
      recommendationId: 9,
    });
  });

  it('gets intervention by id', () => {
    service.getById(8).subscribe((row) => expect(row.sectorId).toBe(1));
    const req = http.expectOne(`${api}/interventions/8`);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 8,
      sectorId: 1,
      performedBy: 'X',
      description: 'Y',
      executionDate: '2026-07-10T17:00:00Z',
      createdAt: '2026-07-10T10:00:00Z',
      recommendationId: null,
    });
  });
});
