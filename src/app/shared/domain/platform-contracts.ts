export type PlatformUserRole = 'PalmGrower' | 'Agronomist' | 'Administrator';

export type PlanType = 'Seed' | 'Harvest' | 'Custom';

export type SubscriptionStatus = 'Pending' | 'Active' | 'Expired' | 'Cancelled' | 'Inactive';

export type ProvisioningState = 'pending' | 'provisioned' | 'revoked' | 'inactive';

export interface DeviceContext {
  iotMac: string;
  gatewayMac: string;
  ownerUserId: number;
  plantationId: number;
  sectorId: number;
  isProvisioned: boolean;
  isActive: boolean;
  provisionedAt?: string | null;
  revokedAt?: string | null;
  lastReadingAt?: string | null;
  isConnected?: boolean;
}
