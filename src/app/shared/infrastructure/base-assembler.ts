/**
 * Mapping contract between DTOs (API shapes) and domain models.
 *
 * Every BC adapter will implement this contract so the infrastructure
 * layer can transform external representations without leaking API
 * details into the domain.
 */
export interface BaseAssembler<TModel, TDto> {
  /** Transform a DTO (API response) into a domain model. */
  toModel(dto: TDto): TModel;

  /** Transform a domain model into a DTO (API request body). */
  toDto(model: TModel): TDto;
}
