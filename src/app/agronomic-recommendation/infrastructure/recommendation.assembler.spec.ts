import { describe, it, expect } from 'vitest';
import {
  composeRecommendationContent,
  recommendationFromBackend,
  toBackendStatusFilter,
  toUiStatus,
} from './recommendation.assembler';

describe('recommendation.assembler', () => {
  it('maps Pending/Approved/Published to UI statuses (case-insensitive)', () => {
    expect(toUiStatus('Pending')).toBe('pending_review');
    expect(toUiStatus('pending')).toBe('pending_review');
    expect(toUiStatus('Approved')).toBe('approved');
    expect(toUiStatus('Published')).toBe('published');
  });

  it('maps UI filters to backend status query values', () => {
    expect(toBackendStatusFilter('pending_review')).toBe('Pending');
    expect(toBackendStatusFilter('approved')).toBe('Approved');
    expect(toBackendStatusFilter('published')).toBe('Published');
    expect(toBackendStatusFilter('Pending')).toBe('Pending');
    expect(toBackendStatusFilter(undefined)).toBeUndefined();
  });

  it('maps backend DTO with id for sector recommendations', () => {
    const rec = recommendationFromBackend(
      {
        id: 12,
        content: 'Riego sector 1\n\nAumentar caudal.\n\nAcción recomendada: Abrir válvula\nPrioridad: high',
        type: 'SectorSpecific',
        status: 'Pending',
        createdAt: '2026-07-10T10:00:00Z',
        approvedAt: null,
        publishedAt: null,
      },
      { sectorId: 1, agronomistId: 3 },
    );

    expect(rec.id).toBe(12);
    expect(rec.sectorId).toBe(1);
    expect(rec.status).toBe('pending_review');
    expect(rec.type).toBe('SectorSpecific');
    expect(rec.scopeLabel).toBe('Sector #1');
    expect(rec.plantationName).toBe('Sector #1');
    expect(rec.title).toContain('Riego');
    expect(rec.hasExplicitAction).toBe(true);
    expect(rec.recommendedAction).toContain('válvula');
    expect(rec.hasExplicitPriority).toBe(true);
    expect(rec.priority).toBe('high');
    expect(rec.clientKey).toBe('id:12');
  });

  it('maps General type with null sector', () => {
    const rec = recommendationFromBackend(
      {
        id: 5,
        content: 'Fumigación general',
        type: 'General',
        status: 'Approved',
        createdAt: '2026-07-10T11:00:00Z',
        approvedAt: '2026-07-10T12:00:00Z',
        publishedAt: null,
      },
      { sectorId: 99, agronomistId: 3 },
    );

    expect(rec.sectorId).toBeNull();
    expect(rec.scopeLabel).toBe('General');
    expect(rec.status).toBe('approved');
  });

  it('composes content from form fields', () => {
    const content = composeRecommendationContent({
      title: 'Aumentar riego',
      description: 'Humedad baja',
      recommendedAction: 'Ajustar caudal',
      priority: 'high',
    });
    expect(content).toContain('Aumentar riego');
    expect(content).toContain('Humedad baja');
    expect(content).toContain('Acción recomendada: Ajustar caudal');
    expect(content).toContain('Prioridad: high');
  });
});
