import mongoose from 'mongoose';
import Realm from './realm.js';

const AuditLogChangeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const AuditLogSchema = new mongoose.Schema(
  {
    realmId: { type: String, ref: Realm, required: true, index: true },
    userId: { type: String, default: '' },
    userEmail: { type: String, default: '', index: true },
    userFullName: { type: String, default: '' },
    action: {
      type: String,
      enum: ['create', 'update', 'delete'],
      required: true,
      index: true
    },
    entityType: {
      type: String,
      enum: ['property', 'lease', 'utility', 'tax'],
      required: true,
      index: true
    },
    entityId: { type: String, default: '' },
    entityName: { type: String, default: '' },
    changes: { type: [AuditLogChangeSchema], default: [] }
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false }
  }
);

AuditLogSchema.index({ realmId: 1, timestamp: -1 });
AuditLogSchema.index({ realmId: 1, entityType: 1, timestamp: -1 });

export default mongoose.model('AuditLog', AuditLogSchema);
