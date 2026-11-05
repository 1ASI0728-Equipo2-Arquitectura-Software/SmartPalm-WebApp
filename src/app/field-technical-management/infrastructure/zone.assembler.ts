import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Zone, DeviceSummary } from '../domain/model/zone.entity';
import { ZoneResponse } from './zone.response';

/**
 * Maps Zone API responses to domain entities and vice versa.
 */
export class ZoneAssembler implements BaseAssembler<Zone, ZoneResponse> {
  toModel(dto: ZoneResponse): Zone {
    const device: DeviceSummary | null = dto.device
      ? {
          id: dto.device.id,
          serialNumber: dto.device.serialNumber,
          connectivityStatus: dto.device.connectivityStatus,
          healthStatus: dto.device.healthStatus,
        }
      : null;

    return { ...dto, device };
  }

  toDto(model: Zone): ZoneResponse {
    return model;
  }
}
