/**
 * Public API facade for the Subscription & User Management bounded context.
 *
 * External BCs should import from this file instead of reaching into
 * individual infrastructure files. This keeps the BC contract explicit
 * and makes future refactors safer.
 */

// Services (keep existing providers working)
export { UserService } from './user-api.service';
export { SubscriptionService } from './subscription-api.service';

// Response contracts
export type { UserProfileResponse } from './user-profile.response';
export type { SubscriptionResponse } from './subscription.response';
export type { SubscriptionPlanResponse } from './subscription-plan.response';

// Assemblers
export { UserProfileAssembler } from './user-profile.assembler';
export { SubscriptionAssembler } from './subscription.assembler';
