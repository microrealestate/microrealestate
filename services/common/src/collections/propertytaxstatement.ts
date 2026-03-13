import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Property from './property.js';
import Realm from './realm.js';

const PropertyTaxUnitSplitSchema =
  new mongoose.Schema<CollectionTypes.PropertyTaxUnitSplit>(
    {
      subPropertyId: { type: String, ref: Property, required: true },
      percentage: { type: Number, required: true }
    },
    { _id: false }
  );

const PropertyTaxPaymentConfirmationSchema =
  new mongoose.Schema<CollectionTypes.PropertyTaxPaymentConfirmation>(
    {
      paidOn: { type: Date, required: true },
      paidAmount: { type: Number, required: true },
      feeAmount: { type: Number, default: 0 },
      paymentMethod: { type: String, default: '' },
      confirmationNumber: { type: String, default: '' },
      notes: { type: String, default: '' },
      attachmentIds: { type: [String], default: [] },
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: String, default: '' }
    },
    { _id: false }
  );

const PropertyTaxStatementSchema =
  new mongoose.Schema<CollectionTypes.PropertyTaxStatement>(
    {
      realmId: { type: String, ref: Realm, required: true, index: true },
      propertyId: { type: String, ref: Property, required: true, index: true },
      taxYearLabel: { type: String, required: true, index: true },
      periodStart: { type: Date, default: null },
      periodEnd: { type: Date, default: null },
      accountNumber: { type: String, default: '' },
      mapNumber: { type: String, default: '' },
      rmvLandLastYear: { type: Number, default: 0 },
      rmvLandThisYear: { type: Number, default: 0 },
      rmvBuildingLastYear: { type: Number, default: 0 },
      rmvBuildingThisYear: { type: Number, default: 0 },
      rmvTotalLastYear: { type: Number, default: 0 },
      rmvTotalThisYear: { type: Number, default: 0 },
      assessedValueLastYear: { type: Number, default: 0 },
      assessedValueThisYear: { type: Number, default: 0 },
      propertyTaxesLastYear: { type: Number, default: 0 },
      propertyTaxesThisYear: { type: Number, default: 0 },
      taxBeforeDiscount: { type: Number, default: 0 },
      delinquentTaxes: { type: Number, default: 0 },
      totalAfterDiscount: { type: Number, default: 0 },
      landLeasedPercentage: { type: Number, default: 100 },
      buildingUnitSplits: { type: [PropertyTaxUnitSplitSchema], default: [] },
      landUnitSplits: { type: [PropertyTaxUnitSplitSchema], default: [] },
      estimatedIncreasePercentage: { type: Number, default: 0 },
      estimatedNextYearTotal: { type: Number, default: 0 },
      estimatedMonthlyCost: { type: Number, default: 0 },
      priorYearEstimatedTotal: { type: Number, default: null },
      priorYearVariance: { type: Number, default: null },
      notes: { type: String, default: '' },
      attachmentIds: { type: [String], default: [] },
      paymentConfirmations: {
        type: [PropertyTaxPaymentConfirmationSchema],
        default: []
      }
    },
    {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
  );

PropertyTaxStatementSchema.index({ propertyId: 1, taxYearLabel: -1 });

export default mongoose.model<CollectionTypes.PropertyTaxStatement>(
  'PropertyTaxStatement',
  PropertyTaxStatementSchema
);
