import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionResponse } from './subscription.response';

/**
 * Maps Subscription API responses to domain entities and vice versa.
 * Currently a thin pass-through — the seam exists so future API shape
 * changes only touch this assembler, not the domain or presentation.
 */
export class SubscriptionAssembler implements BaseAssembler<Subscription, SubscriptionResponse> {
  toModel(dto: SubscriptionResponse): Subscription {
    return dto;
  }

  toDto(model: Subscription): SubscriptionResponse {
    return model;
  }
}
