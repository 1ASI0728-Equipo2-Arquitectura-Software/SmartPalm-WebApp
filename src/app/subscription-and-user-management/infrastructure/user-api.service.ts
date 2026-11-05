import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/domain/user.model';
import { AuthService } from '../../shared/infrastructure/auth.service';

/**
 * Profile API. Backend has no GET /users/me for agronomist (admin-only /users).
 * With real backend + demoAuth, serve/update the session user without HTTP 404.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly api = `${environment.apiUrl}/users`;

  getProfile(): Observable<User> {
    if (environment.demoAuth || environment.dataSource === 'real') {
      const user = this.authService.currentUser;
      if (user) return of({ ...user });
    }
    return this.http.get<User>(`${this.api}/me`);
  }

  updateProfile(
    data: Partial<Pick<User, 'fullName' | 'phone' | 'region' | 'city' | 'avatarUrl'>>,
  ): Observable<User> {
    if (environment.demoAuth || environment.dataSource === 'real') {
      const updated = this.authService.patchCurrentUser(data);
      if (updated) return of(updated);
      return of({
        id: environment.demo.agronomistId,
        email: 'agro1@smartpalm.com',
        fullName: data.fullName ?? 'Agronomist One',
        role: 'agronomist',
        phone: data.phone ?? '',
        region: data.region ?? '',
        city: data.city ?? '',
        avatarUrl: data.avatarUrl ?? null,
        subscriptionId: null,
        createdAt: new Date().toISOString(),
      });
    }
    return this.http.put<User>(`${this.api}/me`, data);
  }
}
