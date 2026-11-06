import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

function jwtWith(payload: Record<string, unknown>): string {
  const encode = (value: string) =>
    btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${encode('{"alg":"none","typ":"JWT"}')}.${encode(JSON.stringify(payload))}.signature`;
}

describe('AuthService — JWT role and expiration', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('uses the administrator role claim from the JWT', () => {
    const token = jwtWith({ role: 'Administrator', exp: Math.floor(Date.now() / 1000) + 3600 });

    service.login({ username: 'admin', password: 'secret' }).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/authentication/sign-in`);
    request.flush({ userId: 1, username: 'admin', token });

    expect(service.currentUser?.role).toBe('administrator');
    expect(service.currentUser?.id).toBe(1);
  });

  it('clears the session and in-memory user when the JWT expires', () => {
    const token = jwtWith({ role: 'PalmGrower', exp: Math.floor(Date.now() / 1000) - 1 });
    sessionStorage.setItem('smartpalm_access_token_v1', token);
    sessionStorage.setItem(
      'smartpalm_user_v1',
      JSON.stringify({ id: 2, username: 'grower', role: 'palm_grower' }),
    );

    const expiredService = TestBed.inject(AuthService);

    expect(expiredService.getToken()).toBeNull();
    expect(expiredService.currentUser).toBeNull();
    expect(sessionStorage.getItem('smartpalm_access_token_v1')).toBeNull();
    expect(sessionStorage.getItem('smartpalm_user_v1')).toBeNull();
  });
});
