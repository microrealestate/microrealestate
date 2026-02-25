import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

/*
  PROPERTY SCHEMA

  THIS FILE DEFINES THE DATABASE STRUCTURE FOR PROPERTIES.

  CHANGES MADE:
  - ADDED BUILDING → UNIT RELATIONSHIP (parentPropertyId)
  - ADDED RENT RANGE FIELDS (LOW / MEDIAN / HIGH) STORED AS $ / SQFT / YEAR

  ALL OTHER FIELDS BELOW ARE ORIGINAL AND UNCHANGED.
*/

const PropertySchema = new mongoose.Schema<CollectionTypes.Property>({
  /*
    ORIGINAL FIELD
    LINKS PROPERTY TO A REALM (MULTI-TENANCY SUPPORT)
  */
  realmId: { type: String, ref: Realm },

  /*
    NEW FIELD — BUILDING → UNIT RELATIONSHIP

    - IF NULL → THIS IS A BUILDING OR STANDALONE PROPERTY
    - IF SET → THIS PROPERTY BELONGS TO A BUILDING
    - REFERENCES ANOTHER PROPERTY DOCUMENT
  */
  parentPropertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },

  /*
    ORIGINAL FIELDS — PROPERTY CORE DATA
  */
  type: String,
  name: String,
  description: String,
  surface: Number,
  phone: String,
  digicode: String,

  /*
    ORIGINAL FIELD — ADDRESS OBJECT
  */
  address: {
    _id: false,
    street1: String,
    street2: String,
    zipCode: String,
    city: String,
    state: String,
    country: String
  },

  /*
    ORIGINAL FIELD — EXISTING RENT PRICE (LEGACY FIELD)
    THIS IS THE CURRENT RENT VALUE
  */
  price: Number,

  /*
    NEW FIELDS — RENT RANGE (ALL STORED AS $ / SQ FT / YEAR)

    PURPOSE:
    - MARKET ANALYSIS
    - PRE-LEASE DISCUSSIONS
    - INTERNAL COMPARISON TOOL

    THESE ARE OPTIONAL AND DEFAULT TO NULL.
  */
  rentLowSqftYear: {
    type: Number,
    default: null
  },
  rentMedianSqftYear: {
    type: Number,
    default: null
  },
  rentHighSqftYear: {
    type: Number,
    default: null
  }
});

/*
  ORIGINAL EXPORT — UNCHANGED
*/
export default mongoose.model<CollectionTypes.Property>(
  'Property',
  PropertySchema
);
