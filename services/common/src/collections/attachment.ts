import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

/*
  ATTACHMENT SCHEMA

  CENTRAL FILE METADATA WITH ONEDRIVE BACKUP SUPPORT

  THIS COLLECTION STORES ALL UPLOADED FILES AND TRACKS THEIR BACKUP STATUS.
  FILES CAN BE ATTACHED TO ANY ENTITY (PROPERTY, NOTE, PROJECT, CONTACT, ETC.)
*/

const AttachmentSchema = new mongoose.Schema<CollectionTypes.Attachment>(
  {
    realmId: { type: String, ref: Realm, required: true, index: true },

    // WHAT THIS FILE IS ATTACHED TO
    targetType: {
      type: String,
      enum: [
        'property',
        'note',
        'project',
        'contact',
        'tenant',
        'contractor',
        'contractor_work',
        'contract'
      ],
      required: true,
      index: true
    },
    targetId: {
      type: String,
      required: true,
      index: true
    },

    // PRIMARY STORAGE METADATA
    storageKey: {
      type: String,
      required: true,
      index: true
    },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },

    // CATEGORY FOR FILTERING/ORGANIZATION
    category: {
      type: String,
      enum: [
        'property_photo',
        'property_record',
        'property_map',
        'note_attachment',
        'project_attachment',
        'work_record_attachment',
        'other'
      ],
      default: 'other',
      index: true
    },

    // WHO UPLOADED
    uploadedById: { type: String, required: true },
    uploadedByName: { type: String },

    // ONEDRIVE BACKUP METADATA
    backupProvider: {
      type: String,
      enum: ['onedrive', null],
      default: null
    },
    backupPath: { type: String, default: null },
    backupStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', null],
      default: 'pending',
      index: true
    },
    backupLastTriedAt: { type: Date, default: null },
    backupError: { type: String, default: null }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

// INDEXES FOR EFFICIENT QUERIES

// Find all attachments for a specific entity
AttachmentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

// Find attachments by category for a specific entity
AttachmentSchema.index({ targetType: 1, targetId: 1, category: 1 });

// Find pending/failed backups for the backup worker
AttachmentSchema.index({ backupStatus: 1, backupLastTriedAt: 1 });

export default mongoose.model<CollectionTypes.Attachment>(
  'Attachment',
  AttachmentSchema
);
