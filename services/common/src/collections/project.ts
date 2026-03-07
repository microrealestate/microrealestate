import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

/*
  PROJECT SCHEMA

  TRACKS WORK/PROJECTS AGAINST PROPERTIES AND OTHER ENTITIES
  
  EXAMPLES:
  - RENOVATION PROJECTS
  - MAINTENANCE WORK
  - CONSTRUCTION PROJECTS
  - INSPECTIONS
*/

const ProjectSchema = new mongoose.Schema<CollectionTypes.Project>(
  {
    realmId: { type: String, ref: Realm, required: true, index: true },

    // WHAT THIS PROJECT IS ASSOCIATED WITH
    targetType: {
      type: String,
      enum: ['property', 'contact', 'tenant', 'contractor'],
      required: true,
      index: true
    },
    targetId: {
      type: String,
      required: true,
      index: true
    },

    // PROJECT DETAILS
    title: { type: String, required: true },
    description: { type: String, default: '' },

    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'on-hold', 'cancelled'],
      default: 'planned',
      index: true
    },

    // DATES
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    completedDate: { type: Date, default: null },

    // COST TRACKING
    estimatedCost: { type: Number, default: null },
    actualCost: { type: Number, default: null },
    currency: { type: String, default: 'USD' },

    // WHO CREATED/MANAGES THIS PROJECT
    createdById: { type: String, required: true },
    createdByName: { type: String },

    // OPTIONAL CONTRACTOR REFERENCE
    contractorId: { type: String, default: null, index: true },
    contractorName: { type: String, default: null }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

// INDEXES FOR EFFICIENT QUERIES

// Find all projects for a specific entity
ProjectSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

// Find projects by status
ProjectSchema.index({ realmId: 1, status: 1, startDate: -1 });

// Find projects by contractor
ProjectSchema.index({ contractorId: 1, status: 1 });

export default mongoose.model<CollectionTypes.Project>(
  'Project',
  ProjectSchema
);
