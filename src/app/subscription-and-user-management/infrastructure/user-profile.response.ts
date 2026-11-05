/** API response shape for user profile endpoints. */
export interface UserProfileResponse {
  id: number;
  email: string;
  fullName: string;
  role: 'palm_grower' | 'agronomist' | 'administrator';
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
