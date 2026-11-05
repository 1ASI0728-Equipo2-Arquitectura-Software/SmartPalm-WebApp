import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Plantation } from '../domain/model/plantation.entity';
import { PlantationResponse } from './plantation.response';

/**
 * Maps Plantation API responses to domain entities and vice versa.
 * Currently a thin pass-through — the seam exists so future API shape
 * changes only touch this assembler, not the domain or presentation.
 */
export class PlantationAssembler implements BaseAssembler<Plantation, PlantationResponse> {
  toModel(dto: PlantationResponse): Plantation {
    return dto;
  }

  toDto(model: Plantation): PlantationResponse {
    return model;
  }
}
