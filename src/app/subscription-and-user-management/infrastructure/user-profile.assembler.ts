import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { User } from '../../shared/domain/user.model';
import { UserProfileResponse } from './user-profile.response';

/**
 * Maps User profile API responses to domain entities and vice versa.
 * Thin pass-through for now — establishes the mapping seam so future
 * API contract changes are isolated to this assembler.
 */
export class UserProfileAssembler implements BaseAssembler<User, UserProfileResponse> {
  toModel(dto: UserProfileResponse): User {
    return dto;
  }

  toDto(model: User): UserProfileResponse {
    return model;
  }
}
