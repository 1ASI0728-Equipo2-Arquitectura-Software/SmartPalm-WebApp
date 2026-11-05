export interface Plantation {
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

export interface CreatePlantationRequest {
  name: string;
  location: string;
  totalHectares: number;
  soilType: string;
  cropAge: string;
  phenologicalPhase: 'produccion' | 'establecimiento';
  latitude?: number;
  longitude?: number;
}

export type UpdatePlantationRequest = Partial<CreatePlantationRequest>;
