/**
 * Public API facade for the Crop Monitoring Dashboard bounded context.
 * Agronomist desk: sector health, recs, interventions, sensors, gateways.
 */

export { CropMonitoringDashboardStore } from '../application/crop-monitoring-dashboard.store';
export type { SparklineItem, DashboardKpis } from '../domain/model/dashboard-view.model';
