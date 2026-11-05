import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { FieldInspection, Intervention } from '../domain/model/inspection.entity';
import { InspectionResponse } from './inspection.response';

/**
 * Maps Inspection API responses to domain entities and vice versa.
 */
export class InspectionAssembler implements BaseAssembler<FieldInspection, InspectionResponse> {
  toModel(dto: InspectionResponse): FieldInspection {
    const interventions: Intervention[] | undefined = dto.interventions?.map((i) => ({
      id: i.id,
      userId: i.userId,
      recommendationId: i.recommendationId,
      plantationId: i.plantationId,
      monitoringZoneId: i.monitoringZoneId,
      action: i.action,
      executedBy: i.executedBy,
      executedAt: i.executedAt,
      result: i.result,
      createdAt: i.createdAt,
    }));

    return { ...dto, interventions };
  }

  toDto(model: FieldInspection): InspectionResponse {
    return model;
  }
}
