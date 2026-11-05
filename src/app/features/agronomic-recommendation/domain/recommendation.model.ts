export interface Recommendation {
  id: number;
  userId: number;
  plantationId: number;
  plantationName: string;
  monitoringZoneId: number;
  zoneName: string;
  alertId: number | null;
  alertTitle: string | null;
  title: string;
  description: string;
  recommendedAction: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'pending_review' | 'approved' | 'published';
  generatedBy: 'ai' | 'manual';
  reviewedByAgronomistId: number | null;
  reviewedByAgronomistName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationListResponse {
  totalElements: number;
  totalPages: number;
  page: number;
  recommendations: Recommendation[];
}

export interface CreateRecommendationRequest {
  plantationId: number;
  monitoringZoneId: number;
  alertId?: number | null;
  title: string;
  description: string;
  recommendedAction: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  generatedBy: 'ai' | 'manual';
}
