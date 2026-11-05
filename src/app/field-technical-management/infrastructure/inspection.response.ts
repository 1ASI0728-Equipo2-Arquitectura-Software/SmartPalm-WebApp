/** API response shape for inspection endpoints. */
export interface InspectionResponse {
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
  interventions?: {
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
  }[];
}
