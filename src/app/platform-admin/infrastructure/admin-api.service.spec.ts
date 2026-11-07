import { describe, expect, it, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AdminApiService } from './admin-api.service';

describe('AdminApiService — ownership and one-time credentials', () => {
  let service: AdminApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminApiService);
    http = TestBed.inject(HttpTestingController);
  });

  it('queries the target user subscription through the administrator endpoint', () => {
    service.getSubscriptionForUser(10).subscribe((response) => {
      expect(response.userId).toBe(10);
      expect(response.status).toBe('Active');
    });

    const request = http.expectOne(`${environment.apiUrl}/admin/subscriptions/users/10`);
    expect(request.request.method).toBe('GET');
    request.flush({ userId: 10, status: 'Active' });
  });

  it('registers a gateway through the administrator route', () => {
    service.registerEdgeGateway('AA:BB:CC:00:00:01', 10, 1).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/admin/edge-gateways`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      edgeMac: 'AA:BB:CC:00:00:01',
      ownerUserId: 10,
      monitoringZoneId: 1,
    });
    request.flush({
      gatewayMac: 'AA:BB:CC:00:00:01',
      ownerUserId: 10,
      cloudKey: 'one-time-cloud-key',
      createdAt: new Date().toISOString(),
    });
  });

  it('registers an IoT device with the selected ownership context', () => {
    service
      .registerIotDevice('AA:BB:CC:00:00:01', {
        iotMac: 'AA:BB:CC:DD:EE:01',
        ownerUserId: 10,
        plantationId: 20,
        sectorId: 30,
      })
      .subscribe();

    const request = http.expectOne(
      `${environment.apiUrl}/admin/edge-gateways/AA%3ABB%3ACC%3A00%3A00%3A01/iot-devices`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.ownerUserId).toBe(10);
    expect(request.request.body.plantationId).toBe(20);
    expect(request.request.body.sectorId).toBe(30);
    request.flush({
      iotMac: 'AA:BB:CC:DD:EE:01',
      ownerUserId: 10,
      plantationId: 20,
      sectorId: 30,
      bootstrapKey: 'one-time-bootstrap-key',
      createdAt: new Date().toISOString(),
    });
  });

  it('starts and polls a user deletion operation through the administrator endpoints', () => {
    service.deleteUser(10).subscribe((response) => expect(response.status).toBe('Pending'));
    const deleteRequest = http.expectOne(`${environment.apiUrl}/admin/users/10`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({
      operationId: 'operation-1',
      userId: 10,
      status: 'Pending',
      expectedServices: 7,
      completedServices: 1,
      requestedAt: new Date().toISOString(),
    });

    service.getUserDeletionStatus('operation-1').subscribe((response) => expect(response.status).toBe('Completed'));
    const statusRequest = http.expectOne(`${environment.apiUrl}/admin/users/deletion-operations/operation-1`);
    expect(statusRequest.request.method).toBe('GET');
    statusRequest.flush({
      operationId: 'operation-1',
      status: 'Completed',
      expectedServices: 7,
      completedServices: 7,
      requestedAt: new Date().toISOString(),
    });
  });
});
