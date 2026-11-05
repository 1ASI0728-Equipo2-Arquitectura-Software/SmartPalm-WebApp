export type UserRole = 'palm_grower' | 'agronomist' | 'administrator';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string;
  region: string;
  city: string;
  avatarUrl: string | null;
  subscriptionId: string | null;
  createdAt: string;
  subscription?: {
    planName: string;
    status: string;
    endDate: string;
  };
}
