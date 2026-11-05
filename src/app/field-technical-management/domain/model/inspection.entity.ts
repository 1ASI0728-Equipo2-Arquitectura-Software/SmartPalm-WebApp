/**
 * Inspection & Intervention domain entities.
 *
 * A FieldInspection captures an agronomist's visit. Each inspection may
 * include one or more Interventions (corrective actions taken on-site).
 */
export interface Intervention {
  id: number;
  userId: number;
  recommendationId: number;
  plantationId: number;
  monitoringZoneId: number;
  action: string;
  executedBy: string;
  executedAt: string;
  result: string;
  createdAt: string;
}

export interface FieldInspection {
  id: number;
  userId: number;
  agronomistName: string;
  plantationId: number;
  plantationName: string;
  monitoringZoneId: number;
  zoneName: string;
  inspectionDate: string;
  observations: string;
  findings: string;
  createdAt: string;
  interventions?: Intervention[];
}

export interface InspectionListResponse {
  totalElements: number;
  totalPages: number;
  page: number;
  inspections: FieldInspection[];
}
