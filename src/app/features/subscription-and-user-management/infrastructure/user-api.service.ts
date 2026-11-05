import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../../../shared/domain/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/users`;

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.api}/me`);
  }

  updateProfile(data: Partial<Pick<User, 'fullName' | 'phone' | 'region' | 'city' | 'avatarUrl'>>): Observable<User> {
    return this.http.put<User>(`${this.api}/me`, data);
  }
}
