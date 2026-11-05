/**
 * Dashboard-specific view models for the agronomist desk.
 */

export type SparklineTrend = 'up' | 'down' | 'stable';

export interface SparklineItem {
  /** Mapped variable type (temperature, soil_humidity, …). */
  key: string;
  label: string;
  unit: string;
  color: string;
  currentValue: number;
  vMin: number;
  vMax: number;
  /** SVG polyline points when enough samples exist. */
  points: string;
  /** Closed polygon for area fill under the line. */
  areaPoints: string;
  sampleCount: number;
  /** True when ≥2 samples — chart is meaningful. */
  hasTrend: boolean;
  trend: SparklineTrend;
}

export interface DashboardKpis {
  pendingRecommendations: number;
  publishedRecommendations: number;
  interventions: number;
  gatewaysConnected: number;
  gatewaysTotal: number;
  latestReadings: number;
  sectorHealthStatus: number | null;
}
