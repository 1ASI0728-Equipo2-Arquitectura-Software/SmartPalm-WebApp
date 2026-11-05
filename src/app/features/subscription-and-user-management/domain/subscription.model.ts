export interface Subscription {
  id: string;
  userId: number;
  planId: string;
  planName: string;
  status: 'active' | 'inactive' | 'expired';
  maxHectares: number;
  maxDevices: number;
  usedHectares: number;
  usedDevices: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  daysRemaining: number;
  segment?: 'palm_grower' | 'agronomist';
  maxGrowers?: number;
  usedGrowers?: number;
  maxReports?: number;
  usedReports?: number;
}
