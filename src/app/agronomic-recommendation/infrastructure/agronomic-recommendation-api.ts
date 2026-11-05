/**
 * Public API facade for the Agronomic Recommendation bounded context.
 *
 * External BCs should import from this file instead of reaching into
 * individual infrastructure files. This keeps the BC contract explicit
 * and makes future refactors safer.
 */

// Services
export { RecommendationService } from './recommendation-api.service';
export { ReportService } from './report-api.service';

// Store
export { AgronomicRecommendationStore } from '../application/agronomic-recommendation.store';
