/**
 * Recommendation domain model for presentation.
 * Maps backend RecommendationResource (docs 2026-07-10):
 * id, content, type (SectorSpecific|General), status (Pending|Approved|Published), dates.
 */
export type RecommendationUiStatus = 'pending_review' | 'approved' | 'published';
export type RecommendationScope = 'sector' | 'general';

export interface Recommendation {
  id: number;
  /** Sector path id when type is SectorSpecific; null for General. */
  sectorId: number | null;
  /** Raw backend content (source of truth). */
  content: string;
  /** Backend type: SectorSpecific | General (or legacy Manual). */
  type: string;
  /**
   * UI status mapped from backend:
   * Pending → pending_review | Approved → approved | Published → published
   */
  status: RecommendationUiStatus;
  createdAt: string;
  approvedAt: string | null;
  publishedAt: string | null;
  /** Stable key for list tracking. */
  clientKey: string;

  // ── Derived for display ──
  title: string;
  description: string;
  recommendedAction: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  hasExplicitPriority: boolean;
  hasExplicitAction: boolean;
  /** Human-readable scope label (Sector #N / General). */
  scopeLabel: string;
  /** Alias of scopeLabel for dashboard / legacy templates. */
  plantationName: string;
  zoneName: string;
  hasZone: boolean;
  generatedBy: 'ai' | 'manual';
  reviewedByAgronomistName: string | null;
  userId: number;
  monitoringZoneId: number;
  alertId: number | null;
  alertTitle: string | null;
  reviewedByAgronomistId: number | null;
  updatedAt: string;
}

export interface RecommendationListResponse {
  totalElements: number;
  totalPages: number;
  page: number;
  recommendations: Recommendation[];
}

/**
 * Form payload. Backend CreateRecommendationResource:
 * { agronomistId, content, reportId? }
 * Path: /sectors/{id}/recommendations or /recommendations/general
 */
export interface CreateRecommendationRequest {
  scope: RecommendationScope;
  sectorId: number | null;
  agronomistId?: number;
  title: string;
  description: string;
  recommendedAction: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportId?: number | null;
}
