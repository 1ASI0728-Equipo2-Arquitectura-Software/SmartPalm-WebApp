import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Device } from '../domain/model/device.entity';
import { DeviceResponse } from './device.response';

/**
 * Maps Device API responses to domain entities and vice versa.
 * Currently a thin pass-through — the seam exists so future API shape
 * changes only touch this assembler, not the domain or presentation.
 */
export class DeviceAssembler implements BaseAssembler<Device, DeviceResponse> {
  toModel(dto: DeviceResponse): Device {
    return dto;
  }

  toDto(model: Device): DeviceResponse {
    return model;
  }
}
