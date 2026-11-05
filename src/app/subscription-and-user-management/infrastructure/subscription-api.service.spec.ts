import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/infrastructure/auth.service';
import { SubscriptionService } from './subscription-api.service';

describe('SubscriptionService — IAM user contract', () => {
  let service: SubscriptionService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/subscriptions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubscriptionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { user: () => ({ id: 3, role: 'agronomist' }) } },
      ],
    });
    service = TestBed.inject(SubscriptionService);
    http = TestBed.inject(HttpTestingController);
  });

  it('gets my subscription and enriches from plans', () => {
    let planName = '';
    let maxHa = -1;
    service.getMySubscription().subscribe((sub) => {
      planName = sub.planName;
      maxHa = sub.maxHectares;
      expect(sub.status).toBe('active');
      expect(sub.planId).toBe('Seed');
      expect(sub.price).toBe(149);
    });

    // forkJoin fires both in parallel
    const subReq = http.expectOne(api);
    const plansReq = http.expectOne(`${api}/plans`);
    expect(subReq.request.method).toBe('GET');
    expect(plansReq.request.method).toBe('GET');

    subReq.flush({
      planType: 'Seed',
      planName: 'Seed',
      price: 149,
      status: 'Active',
      startDate: '2026-07-10T07:37:40',
      endDate: '2026-08-10T07:37:40',
      billingCycle: 'Monthly',
      createdAt: '2026-07-10T07:37:40',
    });
    plansReq.flush([
      {
        type: 'Seed',
        name: 'Seed',
        price: 149,
        billingCycle: 'Monthly',
        maxHectares: 50,
        maxSensors: 20,
        maxPlantationHistory: 3,
      },
    ]);

    expect(planName).toBe('Seed');
    expect(maxHa).toBe(50);
  });

  it('lists payments', () => {
    service.listPayments().subscribe((rows) => {
      expect(rows[0].amount).toBe(149);
      expect(rows[0].status).toBe('completed');
    });
    const req = http.expectOne(`${api}/payments`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        planName: 'Seed',
        periodStart: '2026-07-10T00:00:00',
        periodEnd: '2026-08-10T00:00:00',
        amount: 149,
        status: 'Completed',
        processedAt: '2026-07-10T07:37:40',
      },
    ]);
  });

  it('cancels subscription', () => {
    service.cancel().subscribe((res) => expect(res).toBeTruthy());
    const req = http.expectOne(api);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Cancelled' });
  });

  it('lists plans', () => {
    service.getPlans().subscribe((plans) => {
      expect(plans.length).toBe(2);
      expect(plans[0].id).toBe('Seed');
      expect(plans[0].maxDevices).toBe(20);
    });
    const req = http.expectOne(`${api}/plans`);
    req.flush([
      {
        type: 'Seed',
        name: 'Seed',
        price: 149,
        billingCycle: 'Monthly',
        maxHectares: 50,
        maxSensors: 20,
        maxPlantationHistory: 3,
      },
      {
        type: 'Harvest',
        name: 'Harvest',
        price: 349,
        billingCycle: 'Monthly',
        maxHectares: null,
        maxSensors: null,
        maxPlantationHistory: null,
      },
    ]);
  });
});
