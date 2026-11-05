export interface SubscriptionPlan {
  id: string;
  name: string;
  maxHectares?: number;
  maxDevices?: number;
  priceMonthly: number;
  priceCurrency: string;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  segment?: 'palm_grower' | 'agronomist';
  maxGrowers?: number;
  maxReports?: number;
}
