/**
 * Public API facade for the IoT Device Management bounded context.
 *
 * External BCs should import from this file instead of reaching into
 * individual infrastructure files. This keeps the BC contract explicit
 * and makes future refactors safer.
 */

// Services
export { DeviceService } from './device-api.service';
export { EdgeGatewayService } from './edge-gateway-api.service';
export { IotDeviceContextService } from './iot-device-context.service';
export type {
  ConnectivityStatus,
  GatewayDevices,
  AgronomicThreshold,
  UpdateThresholdRequest,
} from './edge-gateway-api.service';
export type { IotDeviceContext } from './iot-device-context.service';

// Response contracts
export type { DeviceResponse } from './device.response';

// Assemblers
export { DeviceAssembler } from './device.assembler';
