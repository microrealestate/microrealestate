export * from './collections.js';
export * from './environmentvalues.js';
export * from './locales.js';
export * from './redisclient.js';
export * from './service.js';
export type ConnectionRole = 'administrator' | 'renter' | 'tenant';
export type UserRole = Exclude<ConnectionRole, 'tenant'>;
export type ConnectionType = 'service' | 'user' | 'application';
export type PaymentMethod = 'transfer' | 'credit-card' | 'cash' | 'check';
export type PaymentStatus = 'paid' | 'partially-paid' | 'unpaid';
export type LeaseStatus = 'active' | 'ended' | 'terminated';
export type LeaseTimeRange = 'days' | 'weeks' | 'months' | 'years';
/**
 * Lifecycle status for a LeaseInstance (the actual lease record, not the template).
 * - draft: created but not yet activated; no property block; required fields may be incomplete
 * - active: signed document present, all required fields set, date window is current
 * - expired: end date has passed; archived for historical reads
 */
export type LeaseInstanceStatus = 'draft' | 'active' | 'expired';
