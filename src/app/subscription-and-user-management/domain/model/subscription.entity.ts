export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'pending' | 'cancelled';

export interface Subscription {
  id: string;
  userId: number;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
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
  /** Live IAM fields */
  price?: number;
  billingCycle?: string;
  currency?: string;
}

export interface SubscriptionPayment {
  planName: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: string;
  processedAt: string;
}
