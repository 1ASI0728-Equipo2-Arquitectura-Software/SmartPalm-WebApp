/**
 * Public API facade for the Alert & Notification bounded context.
 *
 * External BCs should import from this file instead of reaching into
 * individual infrastructure files. This keeps the BC contract explicit
 * and makes future refactors safer.
 */

// Services
export { AlertService } from './alert-api.service';
export { NotificationService } from './notification-api.service';
