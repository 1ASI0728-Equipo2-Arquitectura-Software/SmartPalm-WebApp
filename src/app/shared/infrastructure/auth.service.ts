import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest } from '../domain/auth-response.model';
import { User, UserRole } from '../domain/user.model';
import { decodeJwtPayload, userIdFromToken } from './jwt.util';

const TOKEN_KEY = 'smartpalm_access_token_v1';
const USER_KEY = 'smartpalm_user_v1';
const LEGACY_KEYS = ['accessToken', 'user', 'smartpalm_demo_users_v1'];

/** Backend POST /authentication/sign-in response (IAM docs 2026-07-10). */
interface SignInApiResponse {
  userId: number;
  username: string;
  token: string;
}

/**
 * Auth uses sessionStorage so each browser tab can hold a different session
 * (e.g. agronomist desk + admin console open at once for demos).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  private readonly currentUser$ = new BehaviorSubject<User | null>(null);
  readonly user$ = this.currentUser$.asObservable();

  constructor() {
    const stored = this.readStoredSession();
    if (stored) {
      this.setUser(stored.user);
    }
  }

  get isAuthenticated(): boolean {
    if (environment.demoAuth) {
      return !!this._user();
    }
    return !!this._user() && !!this.getToken();
  }

  get currentUser(): User | null {
    return this._user();
  }

  get isAdministrator(): boolean {
    return this._user()?.role === 'administrator';
  }

  private setUser(user: User | null): void {
    this._user.set(user);
    this.currentUser$.next(user);
  }

  private storage(): Storage | null {
    if (!this.isBrowser) return null;
    return sessionStorage;
  }

  /**
   * POST /api/v1/authentication/sign-in
   * Body: { username, password } (camelCase)
   * 200: { userId, username, token }
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    const username = (request.username ?? request.email ?? '').trim();
    const password = request.password ?? '';

    return this.http
      .post<SignInApiResponse>(`${environment.apiUrl}/authentication/sign-in`, {
        username,
        password,
      })
      .pipe(
        map((body) => this.mapSignInToAuthResponse(body)),
        tap((res) => this.persist(res)),
      );
  }

  register(_request?: unknown): Observable<AuthResponse> {
    return new Observable((sub) => {
      sub.error({
        status: 404,
        message: 'El registro público no está disponible. Contacta a un administrador.',
      });
    });
  }

  recoverPassword(_email: string): Observable<{ message: string }> {
    return new Observable((sub) => {
      sub.error({
        status: 501,
        message: 'Recuperación de contraseña no disponible en el backend actual.',
      });
    });
  }

  resetPassword(_token: string, _newPassword: string): Observable<{ message: string }> {
    return new Observable((sub) => {
      sub.error({
        status: 501,
        message: 'Restablecimiento de contraseña no disponible en el backend actual.',
      });
    });
  }

  patchCurrentUser(partial: Partial<User>): User | null {
    const current = this._user();
    if (!current) return null;
    const updated = { ...current, ...partial };
    const store = this.storage();
    if (store) {
      store.setItem(USER_KEY, JSON.stringify(updated));
    }
    this.setUser(updated);
    return updated;
  }

  logout(): void {
    const store = this.storage();
    if (store) {
      store.removeItem(TOKEN_KEY);
      store.removeItem(USER_KEY);
    }
    if (this.isBrowser) {
      // Clear legacy localStorage keys so old sessions do not leak across tabs.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    }
    this.setUser(null);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    const store = this.storage();
    const token =
      store?.getItem(TOKEN_KEY) ??
      localStorage.getItem(TOKEN_KEY) ??
      localStorage.getItem('accessToken');
    if (!token || token.startsWith('demo-token') || token === 'pending-real-token') return null;
    if (token.split('.').length !== 3) return null;
    return token;
  }

  private persist(res: AuthResponse): void {
    const store = this.storage();
    if (store) {
      store.setItem(TOKEN_KEY, res.accessToken);
      store.setItem(USER_KEY, JSON.stringify(res.user));
    }
    if (this.isBrowser) {
      // Prefer per-tab session; remove shared local session.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    }
    this.setUser(res.user);
  }

  private readStoredSession(): { user: User } | null {
    if (!this.isBrowser) return null;
    this.clearLegacyIfNeeded();
    if (!environment.demoAuth && !this.getToken()) {
      this.storage()?.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const raw = this.storage()?.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return { user: JSON.parse(raw) as User };
    } catch {
      return null;
    }
  }

  private clearLegacyIfNeeded(): void {
    if (!this.isBrowser) return;
    if (this.storage()?.getItem(USER_KEY) || this.storage()?.getItem(TOKEN_KEY)) {
      for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    }
  }

  private mapSignInToAuthResponse(body: SignInApiResponse): AuthResponse {
    const token = body.token;
    const id = body.userId || userIdFromToken(token) || 0;
    const username = body.username || '';
    const role = this.resolveRole(token, username);
    const profile = this.knownSeedProfile(username, id);

    const user: User = {
      id,
      email: profile.email,
      fullName: profile.fullName,
      role,
      phone: '',
      region: '',
      city: '',
      avatarUrl: null,
      subscriptionId: null,
      createdAt: new Date().toISOString(),
    };

    return { accessToken: token, user };
  }

  private knownSeedProfile(
    username: string,
    userId: number,
  ): { email: string; fullName: string } {
    const key = username.trim().toLowerCase();
    const seeds: Record<string, { email: string; fullName: string }> = {
      agronomist01: {
        email: 'agro1@smartpalm.com',
        fullName: 'Agronomist One',
      },
      admin: {
        email: 'admin@smartpalm.com',
        fullName: 'System Administrator',
      },
      palmgrower01: {
        email: 'grower1@smartpalm.com',
        fullName: 'Palm Grower One',
      },
    };
    if (seeds[key]) return seeds[key];
    if (userId === environment.demo.agronomistId) {
      return {
        email: 'agro1@smartpalm.com',
        fullName: 'Agronomist One',
      };
    }
    return {
      email: username.includes('@') ? username : `${username}@smartpalm.local`,
      fullName: username,
    };
  }

  /**
   * JWT may omit role; backend Authorize middleware loads role from DB.
   * Front uses claims + username heuristics for UI routing only.
   */
  private resolveRole(token: string, username: string): UserRole {
    const payload = decodeJwtPayload(token);
    const raw =
      (payload?.role as string | undefined) ||
      (payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as
        | string
        | undefined) ||
      '';
    const normalized = raw.toLowerCase().replace(/\s+/g, '');
    if (normalized.includes('admin')) return 'administrator';
    if (normalized.includes('grower') || normalized === 'palmgrower') return 'palm_grower';
    if (normalized.includes('agronom')) return 'agronomist';

    const u = username.trim().toLowerCase();
    // Exact/prefix match only — do not use includes('admin') (false positives).
    if (u === 'admin' || u.startsWith('admin')) return 'administrator';
    if (u.includes('grower') || u === 'palmgrower01') return 'palm_grower';
    if (u.includes('agronom') || u === 'agronomist01') return 'agronomist';
    return 'agronomist';
  }
}
