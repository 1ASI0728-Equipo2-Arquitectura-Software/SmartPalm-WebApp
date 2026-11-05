import { Recommendation } from '../domain/model/recommendation.entity';
import { RecommendationBackendDto } from './recommendation.response';

const STATUS_TO_UI: Record<string, Recommendation['status']> = {
  Pending: 'pending_review',
  Approved: 'approved',
  Published: 'published',
  pending: 'pending_review',
  approved: 'approved',
  published: 'published',
  pending_review: 'pending_review',
};

/**
 * Query-string filter values for live API (case-insensitive on server).
 * Prefer PascalCase as documented examples: Pending | Approved | Published.
 */
const STATUS_TO_BACKEND: Record<string, string> = {
  draft: 'Pending',
  pending_review: 'Pending',
  approved: 'Approved',
  published: 'Published',
  Pending: 'Pending',
  Approved: 'Approved',
  Published: 'Published',
  pending: 'Pending',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
};

const PRIORITY_ALIASES: Record<string, Recommendation['priority']> = {
  low: 'low',
  baja: 'low',
  medium: 'medium',
  media: 'medium',
  high: 'high',
  alta: 'high',
  critical: 'critical',
  critica: 'critical',
  crítica: 'critical',
};

export function recommendationClientKey(content: string, createdAt: string, id?: number): string {
  if (id && id > 0) return `id:${id}`;
  return `${createdAt}::${content}`;
}

export function toUiStatus(backendStatus: string): Recommendation['status'] {
  return STATUS_TO_UI[backendStatus] ?? STATUS_TO_UI[backendStatus?.toLowerCase?.() ?? ''] ?? 'pending_review';
}

export function toBackendStatusFilter(uiOrBackend: string | undefined): string | undefined {
  if (!uiOrBackend) return undefined;
  return STATUS_TO_BACKEND[uiOrBackend] ?? uiOrBackend;
}

/** Compose backend content from form fields (backend only stores free text). */
export function composeRecommendationContent(parts: {
  title: string;
  description: string;
  recommendedAction: string;
  priority?: string;
}): string {
  const lines = [parts.title.trim(), '', parts.description.trim()];
  if (parts.recommendedAction?.trim()) {
    lines.push('', `Acción recomendada: ${parts.recommendedAction.trim()}`);
  }
  if (parts.priority) {
    lines.push(`Prioridad: ${parts.priority}`);
  }
  return lines.join('\n').trim();
}

/**
 * Maps backend DTO → domain Recommendation for UI.
 * Id comes from the resource (no Location/probe registry).
 */
export function recommendationFromBackend(
  dto: RecommendationBackendDto,
  opts: { sectorId?: number | null; agronomistId?: number } = {},
): Recommendation {
  const content = (dto.content ?? '').trim();
  const createdAt = dto.createdAt ?? new Date().toISOString();
  const id = typeof dto.id === 'number' && dto.id > 0 ? dto.id : 0;
  const parsed = parseContent(content);
  const type = dto.type || 'SectorSpecific';
  const isGeneral = type.toLowerCase() === 'general';
  const sectorId = isGeneral ? null : (opts.sectorId ?? null);
  // Language-neutral technical labels (UI adds i18n type badges separately).
  const scopeLabel = isGeneral
    ? 'General'
    : sectorId != null
      ? `Sector #${sectorId}`
      : type;

  return {
    id,
    sectorId,
    content,
    type,
    status: toUiStatus(dto.status),
    createdAt,
    approvedAt: dto.approvedAt,
    publishedAt: dto.publishedAt,
    clientKey: recommendationClientKey(content, createdAt, id),
    title: parsed.title,
    description: parsed.description,
    recommendedAction: parsed.action,
    priority: parsed.priority ?? 'medium',
    hasExplicitPriority: parsed.priority !== null,
    hasExplicitAction: parsed.hasAction,
    scopeLabel,
    plantationName: scopeLabel,
    zoneName: parsed.zone ?? '',
    hasZone: !!parsed.zone,
    generatedBy: 'manual',
    reviewedByAgronomistName: dto.approvedAt ? 'Agronomist' : null,
    userId: opts.agronomistId ?? 0,
    monitoringZoneId: 0,
    alertId: null,
    alertTitle: null,
    reviewedByAgronomistId: dto.approvedAt ? (opts.agronomistId ?? null) : null,
    updatedAt: dto.publishedAt ?? dto.approvedAt ?? createdAt,
  };
}

function parseContent(content: string): {
  title: string;
  description: string;
  action: string;
  hasAction: boolean;
  priority: Recommendation['priority'] | null;
  zone: string | null;
} {
  if (!content) {
    return {
      title: 'Recomendación',
      description: '',
      action: '',
      hasAction: false,
      priority: null,
      zone: null,
    };
  }

  const lines = content.split(/\r?\n/).map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);
  const title = nonEmpty[0] ?? 'Recomendación';
  const titleShort = title.length > 100 ? `${title.slice(0, 97)}…` : title;

  let action = '';
  let hasAction = false;
  let priority: Recommendation['priority'] | null = null;

  for (const line of nonEmpty) {
    const actionMatch = line.match(/^(?:Acci[oó]n recomendada|Recommended action)\s*:\s*(.+)$/i);
    if (actionMatch) {
      action = actionMatch[1].trim();
      hasAction = true;
      continue;
    }
    const prioMatch = line.match(/^(?:Prioridad|Priority)\s*:\s*(\S+)/i);
    if (prioMatch) {
      const key = prioMatch[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      priority = PRIORITY_ALIASES[key] ?? null;
    }
  }

  const zoneMatch = content.match(/\bzona\s+([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)/i);
  const zone = zoneMatch ? zoneMatch[0] : null;

  return {
    title: titleShort,
    description: content,
    action: hasAction ? action : '',
    hasAction,
    priority,
    zone,
  };
}
