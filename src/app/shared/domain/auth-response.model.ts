import { User } from './user.model';

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'palm_grower' | 'agronomist';
  phone: string;
  region: string;
  city: string;
}

export interface LoginRequest {
  /** Backend IAM uses `username` (not email). Kept optional for legacy form fields. */
  username?: string;
  email?: string;
  password: string;
}
