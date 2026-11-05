import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseAssembler } from './base-assembler';
import { BaseResource } from './base-response';

/**
 * Generic reusable CRUD endpoint for a single resource type.
 *
 * TModel  — domain model (what the rest of the app consumes).
 * TDto    — DTO shape exchanged with the API.
 *
 * Every BC adapter can instantiate (or extend) this class for a
 * consistent REST contract without rewriting the same HttpClient
 * boilerplate.
 */
export class BaseApiEndpoint<TModel extends BaseResource, TDto extends BaseResource> {
  constructor(
    protected readonly http: HttpClient,
    protected readonly resourceUrl: string,
    protected readonly assembler: BaseAssembler<TModel, TDto>,
  ) {}

  /** GET  /resource         → list */
  list(): Observable<TModel[]> {
    return this.http.get<TDto[]>(this.resourceUrl) as unknown as Observable<TModel[]>;
    // NOTE: mapping through the assembler will be added once BCs
    // adopt the pattern. For now the endpoint returns raw DTOs.
  }

  /** GET  /resource/:id      → single */
  getById(id: number): Observable<TModel> {
    return this.http.get<TDto>(`${this.resourceUrl}/${id}`) as unknown as Observable<TModel>;
  }

  /** POST /resource          → create */
  create(body: Partial<TModel>): Observable<TModel> {
    return this.http.post<TDto>(this.resourceUrl, body) as unknown as Observable<TModel>;
  }

  /** PUT  /resource/:id      → update */
  update(id: number, body: Partial<TModel>): Observable<TModel> {
    return this.http.put<TDto>(`${this.resourceUrl}/${id}`, body) as unknown as Observable<TModel>;
  }

  /** DELETE /resource/:id    → delete */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }
}
