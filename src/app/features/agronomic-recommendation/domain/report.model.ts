export interface Report {
  id: number;
  userId: number;
  agronomistId?: number;
  agronomistName: string;
  plantationId: number;
  plantationName: string;
  title: string;
  summary: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  sections?: {
    cropHealth: {
      overall: string;
      byZone: { zoneName: string; status: string; hectares: number }[];
    };
    activeAlerts: { id: number; title: string; level: string; zoneName: string }[];
    recommendations: { id: number; title: string; priority: string }[];
    sensorSummary: {
      avgTemperature: number | null;
      avgHumidity: number | null;
      avgPh: number | null;
    };
  };
}

export interface ReportListResponse {
  totalElements: number;
  totalPages: number;
  page: number;
  reports: Report[];
}
