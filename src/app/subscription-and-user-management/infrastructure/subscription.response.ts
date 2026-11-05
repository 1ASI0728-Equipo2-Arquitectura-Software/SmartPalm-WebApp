import { Subscription, SubscriptionPayment, SubscriptionStatus } from '../domain/model/subscription.entity';
import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';

/** Domain-aligned subscription DTO (after mapping). */
export type SubscriptionResponse = Subscription;

/**
 * Live IAM GET /api/v1/subscriptions (Active):
 * { planType, planName, price, status, startDate, endDate, billingCycle, createdAt }
 * Non-active may return a reduced shape (docs e2e §5.2).
 */
export interface SubscriptionBackendDto {
  planType?: string;
  planName?: string;
  price?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  billingCycle?: string;
  createdAt?: string;
  amountDue?: number;
  id?: string;
  userId?: number;
  planId?: string;
  maxHectares?: number;
  maxDevices?: number;
  usedHectares?: number;
  usedDevices?: number;
  autoRenew?: boolean;
  paymentMethod?: string;
  daysRemaining?: number;
  segment?: 'palm_grower' | 'agronomist';
}

/** Live GET /api/v1/subscriptions/plans */
export interface SubscriptionPlanBackendDto {
  type?: string;
  name?: string;
  price?: number;
  billingCycle?: string;
  maxHectares?: number | null;
  maxSensors?: number | null;
  maxPlantationHistory?: number | null;
  id?: string;
  priceMonthly?: number;
  priceCurrency?: string;
  maxDevices?: number;
  features?: string[];
  isActive?: boolean;
  segment?: 'palm_grower' | 'agronomist';
  maxGrowers?: number;
  maxReports?: number;
}

/** Live GET /api/v1/subscriptions/payments */
export interface SubscriptionPaymentBackendDto {
  planName?: string;
  periodStart?: string;
  periodEnd?: string;
  amount?: number;
  status?: string;
  processedAt?: string;
}

function mapStatus(raw?: string): SubscriptionStatus {
  const s = (raw ?? 'Active').toLowerCase();
  if (s === 'active') return 'active';
  if (s === 'pending') return 'pending';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'expired') return 'expired';
  if (s === 'inactive') return 'inactive';
  return 'active';
}

export function mapSubscriptionFromBackend(
  dto: SubscriptionBackendDto,
  userId = 0,
  planCatalog?: SubscriptionPlan[],
): Subscription {
  const start = dto.startDate ?? dto.createdAt ?? new Date().toISOString();
  const end = dto.endDate ?? start;
  const endMs = new Date(end).getTime();
  const daysRemaining =
    dto.daysRemaining ??
    (Number.isFinite(endMs)
      ? Math.max(0, Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0);

  const planId = dto.planId ?? dto.planType ?? dto.planName ?? 'Seed';
  const plan = planCatalog?.find(
    (p) => p.id.toLowerCase() === planId.toLowerCase() || p.name.toLowerCase() === planId.toLowerCase(),
  );

  return {
    id: dto.id ?? `sub-${userId || 'me'}`,
    userId: dto.userId ?? userId,
    planId,
    planName: dto.planName ?? plan?.name ?? planId,
    status: mapStatus(dto.status),
    maxHectares: dto.maxHectares ?? plan?.maxHectares ?? 0,
    maxDevices: dto.maxDevices ?? plan?.maxDevices ?? 0,
    usedHectares: dto.usedHectares ?? 0,
    usedDevices: dto.usedDevices ?? 0,
    startDate: start,
    endDate: end,
    autoRenew: dto.autoRenew ?? false,
    paymentMethod: dto.paymentMethod ?? '—',
    daysRemaining,
    segment: dto.segment ?? 'agronomist',
    maxGrowers: plan?.maxGrowers,
    maxReports: plan?.maxReports,
    usedGrowers: 0,
    usedReports: 0,
    price: dto.price ?? plan?.priceMonthly,
    billingCycle: dto.billingCycle ?? plan?.billingCycle,
    currency: plan?.priceCurrency ?? 'USD',
  };
}

export function mapPlanFromBackend(dto: SubscriptionPlanBackendDto): SubscriptionPlan {
  const id = dto.id ?? dto.type ?? dto.name ?? 'plan';
  const name = dto.name ?? dto.type ?? id;
  const maxHectares =
    dto.maxHectares === null || dto.maxHectares === undefined ? undefined : dto.maxHectares;
  const maxDevices =
    dto.maxDevices ??
    (dto.maxSensors === null || dto.maxSensors === undefined ? undefined : dto.maxSensors);
  const maxReports =
    dto.maxReports ??
    (dto.maxPlantationHistory === null || dto.maxPlantationHistory === undefined
      ? undefined
      : dto.maxPlantationHistory);

  const features =
    dto.features && dto.features.length
      ? dto.features
      : buildDefaultFeatures(maxHectares, maxDevices, maxReports);

  return {
    id,
    name,
    maxHectares,
    maxDevices,
    priceMonthly: dto.priceMonthly ?? dto.price ?? 0,
    priceCurrency: dto.priceCurrency ?? 'USD',
    billingCycle: (dto.billingCycle ?? 'Monthly').toLowerCase().includes('year')
      ? 'yearly'
      : 'monthly',
    features,
    isActive: dto.isActive ?? true,
    segment: dto.segment ?? 'agronomist',
    maxGrowers: dto.maxGrowers,
    maxReports,
  };
}

function buildDefaultFeatures(
  maxHectares?: number,
  maxDevices?: number,
  maxReports?: number,
): string[] {
  const f: string[] = [];
  if (maxHectares != null) f.push(`maxHectares:${maxHectares}`);
  else f.push('maxHectares:unlimited');
  if (maxDevices != null) f.push(`maxSensors:${maxDevices}`);
  else f.push('maxSensors:unlimited');
  if (maxReports != null) f.push(`maxHistory:${maxReports}`);
  return f;
}

export function mapPaymentFromBackend(dto: SubscriptionPaymentBackendDto): SubscriptionPayment {
  return {
    planName: dto.planName ?? '—',
    periodStart: dto.periodStart ?? '',
    periodEnd: dto.periodEnd ?? '',
    amount: dto.amount ?? 0,
    status: (dto.status ?? 'Completed').toLowerCase(),
    processedAt: dto.processedAt ?? '',
  };
}
