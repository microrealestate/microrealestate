import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const NoteAttachmentSchema = new mongoose.Schema(
  {
    originalName: String,
    mimeType: String,
    sizeBytes: Number,
    storageKey: String,
    uploadedBy: String,
    uploadedAt: Date
  },
  { _id: true }
);

const NoteSchema = new mongoose.Schema(
  {
    realmId: { type: String, ref: Realm },

    entityType: {
      type: String,
      enum: ['property', 'contact', 'contract', 'project'],
      index: true
    },

    entityId: { type: String, required: true, index: true },

    authorId: { type: String, required: true },

    authorName: String,

    content: { type: String, required: true },

    tags: [String],
    pinned: { type: Boolean, default: false },

    attachments: [NoteAttachmentSchema],

    deletedDate: { type: Date, default: null, index: true }
  },
  {
    timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' }
  }
);

// Fast fetch for entity notes
NoteSchema.index({ entityType: 1, entityId: 1, createdDate: -1 });

// Text search
NoteSchema.index({ content: 'text', tags: 'text' });

export default mongoose.model<CollectionTypes.Note>('Note', NoteSchema);
