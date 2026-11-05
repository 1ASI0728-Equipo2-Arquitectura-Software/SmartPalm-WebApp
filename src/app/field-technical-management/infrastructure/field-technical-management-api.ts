/**
 * Public API facade for the Field Technical Management bounded context.
 *
 * External BCs should import from this file instead of reaching into
 * individual infrastructure files. This keeps the BC contract explicit
 * and makes future refactors safer.
 */

// Services
export { PlantationService } from './plantation-api.service';
export { InspectionService } from './inspection-api.service';
export { Bc01AccessService } from './bc01-access.service';
export type { Bc01WriteAccess } from './bc01-access.service';

// Response contracts
export type { PlantationResponse } from './plantation.response';
export type { ZoneResponse } from './zone.response';
export type { InspectionResponse } from './inspection.response';

// Assemblers
export { PlantationAssembler } from './plantation.assembler';
export { ZoneAssembler } from './zone.assembler';
export { InspectionAssembler } from './inspection.assembler';
