import mongoose from 'mongoose';
import Realm from './realm.js';
/*
  LEASE INSTANCE SCHEMA

  Represents an actual lease record (not a lease template).
  Tracks the full lifecycle: draft → active → expired.

  Key design decisions:
  - Separate from the legacy `Lease` (template) model so rent/billing logic is unchanged.
  - `propertyId` is a single property or unit ID (one lease = one rentable unit).
  - `tenantIds` is an array for multi-tenant leases (e.g., co-signers).
  - Only `active` leases enforce date-range conflicts; `draft` leases are non-blocking.
  - Expiration is driven by `endDate` comparison; status is reconciled server-side.
*/
const LeaseInstanceSchema = new mongoose.Schema({
    realmId: { type: String, ref: Realm, required: true, index: true },
    status: {
        type: String,
        enum: ['draft', 'active', 'expired'],
        default: 'draft',
        index: true
    },
    // Lease date window (required before activation)
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null, index: true },
    // Set when the lease transitions from draft → active
    activatedAt: { type: Date, default: null },
    // One or more tenants on this lease (required before activation, min 1)
    tenantIds: [{ type: String }],
    // The property or unit this lease applies to (required before activation)
    propertyId: { type: String, default: null, index: true },
    // Draft/unsigned documents (Word .docx or unsigned PDFs) — Attachment IDs
    draftDocumentIds: [{ type: String }],
    // The signed lease document — Attachment ID (required before activation)
    signedDocumentId: { type: String, default: null },
    // Optional free-text notes
    notes: { type: String, default: '' },
    // Future invoicing email (not used for billing logic in this version)
    invoiceEmail: { type: String, default: null },
    lastUpdatedBy: { type: String, default: '' }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});
// Compound index for efficient overlap detection:
// "Find active leases for this property in this realm"
LeaseInstanceSchema.index({ realmId: 1, propertyId: 1, status: 1, startDate: 1, endDate: 1 });
// Index for looking up leases by tenant
LeaseInstanceSchema.index({ realmId: 1, tenantIds: 1 });
export default mongoose.model('LeaseInstance', LeaseInstanceSchema);
