/** Backend RecommendationResource (docs 2026-07-10 — includes id). */
export interface RecommendationBackendDto {
  id: number;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  publishedAt: string | null;
}

export interface CreateRecommendationBackendBody {
  agronomistId: number;
  content: string;
  reportId?: number | null;
}

export interface UpdateRecommendationContentBody {
  content: string;
}
