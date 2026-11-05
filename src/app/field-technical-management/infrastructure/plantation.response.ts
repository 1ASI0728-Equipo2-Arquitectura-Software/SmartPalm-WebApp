/** API response shape for the plantation endpoints. */
export interface PlantationResponse {
  id: number;
  userId: number;
  name: string;
  location: string;
  totalHectares: number;
  soilType: string;
  cropAge: string;
  phenologicalPhase: 'produccion' | 'establecimiento';
  latitude: number;
  longitude: number;
  zonesCount?: number;
  devicesCount?: number;
  overallHealth?: 'optimal' | 'at_risk' | 'critical' | null;
  createdAt: string;
  updatedAt: string;
}
