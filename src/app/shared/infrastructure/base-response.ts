/**
 * Minimal contracts consumed by infrastructure adapters.
 * These contracts will be extended once each BC adopts the hexagonal pattern.
 */

/** Empty marker for untyped API responses (gradually replaced by typed variants). */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BaseResponse {}

/** Resource returned by a REST endpoint — guarantees an id. */
export interface BaseResource {
  id: number;
}
