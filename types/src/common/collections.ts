import { LeaseTimeRange, Locale, PaymentMethod, UserRole } from './index.js';

export type MongooseDocument<T> = {
  __v: number;
  save: () => Promise<T>;
  toObject: () => T;
} & T;

/* eslint-disable @typescript-eslint/no-namespace */
export namespace CollectionTypes {
  export type PartAddress = {
    street1: string;
    street2?: string;
    zipCode: string;
    city: string;
    state?: string;
    country: string;
  };

  export type Account = {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    createdDate?: Date;
  };

  export type Realm = {
    _id: string;
    name: string;
    members: {
      name: string;
      email: string;
      role: UserRole;
      registered: boolean;
    }[];
    applications: {
      name: string;
      role: UserRole;
      clientId: string;
      clientSecret: string;
      createdDate: Date;
      expiryDate: Date;
    }[];
    addresses: CollectionTypes.PartAddress[];
    bankInfo: {
      name: string;
      iban: string;
    };
    contacts: {
      name: string;
      email: string;
      phone1: string;
      phone2: string;
    }[];
    isCompany: boolean;
    companyInfo: {
      name: string;
      legalStructure: string;
      legalRepresentative: string;
      capital: number;
      ein: string;
      dos: string;
      vatnumber: string;
    };
    thirdParties: {
      gmail: {
        selected: boolean;
        email: string;
        appPassword: string;
        fromEmail: string;
        replyToEmail: string;
      };
      mailgun: {
        selected: boolean;
        apiKey: string;
        domain: string;
        fromEmail: string;
        replyToEmail: string;
      };
      b2: {
        keyId: string;
        applicationKey: string;
        endpoint: string;
        bucket: string;
      };
    };
    locale: Locale;
    currency: string;
  };

  export type Document = {
    _id: string;
    realmId: string;
    tenantId: string;
    leaseId: string;
    templateId: string;
    type: 'text' | 'file';
    name: string;
    description: string;
    mimeType?: string;
    expiryDate?: Date;
    contents?: Record<string, never>;
    html?: string;
    url?: string;
    versionId?: string;
    createdDate: Date;
    updatedDate: Date;
  };

  export type Email = {
    _id: string;
    templateName: string;
    recordId: string;
    params: Record<string, never>;
    sentTo: string;
    sentDate: Date;
    status: string;
    emailId: string;
  };

  export type Lease = {
    _id: string;
    realmId: string;
    name: string;
    description: string;
    numberOfTerms: number;
    timeRange: LeaseTimeRange;
    active: boolean;
    stepperMode: boolean;
  };

  export type Property = {
    _id: string;
    realmId: string;

    // ORIGINAL FIELD — PROPERTY TYPE (BUILDING, APARTMENT, OFFICE, ETC.)
    type: string;

    // ORIGINAL CORE FIELDS
    name: string;
    description: string;
    surface: number;
    phone: string;
    digicode: string;
    address: CollectionTypes.PartAddress;
    price: number;

    // NEW FIELD — BUILDING / UNIT RELATIONSHIP
    // IF SET → THIS PROPERTY BELONGS TO ANOTHER PROPERTY (LIKELY A BUILDING)
    // IF NULL / UNDEFINED → THIS IS A BUILDING OR STANDALONE PROPERTY
    parentPropertyId?: string | null;

    // NEW FIELDS — RENT RANGE IN $ / SQ FT / YEAR
    // OPTIONAL — USED FOR MARKET RANGE / COMPS
    rentLowSqftYear?: number | null;
    rentMedianSqftYear?: number | null;
    rentHighSqftYear?: number | null;

    // ORIGINAL LEGACY FIELDS (COMMENT SAYS THEY ARE TO BE REMOVED LATER)
    // KEEPING THEM TO AVOID BREAKING EXISTING CODE
    // TODO TO REMOVE, REPLACED BY address
    building: string;
    level: string;
    location: string;
  };

  export type Template = {
    _id: string;
    realmId: string;
    name: string;
    type: string;
    description: string;
    hasExpiryDate: boolean;
    contents: Record<string, never>;
    html: string;
    linkedResourceIds: string[];
    required: boolean;
    requiredOnceContractTerminated: boolean;
  };

  export type PartRent = {
    term: number;
    total: {
      preTaxAmount: number;
      charges: number;
      vat: number;
      discount: number;
      debts: number;
      balance: number;
      grandTotal: number;
      payment: number;
    };
    preTaxAmounts:
      | {
          amount: number;
          description: string;
        }[]
      | [];
    charges:
      | {
          amount: number;
          description: string;
        }[]
      | [];
    debts:
      | {
          amount: number;
          description: string;
        }[]
      | [];
    discounts:
      | {
          origin: 'contract' | 'settlement';
          amount: number;
          description: string;
        }[]
      | [];
    vats:
      | {
          origin: 'contract' | 'settlement';
          amount: number;
          description: string;
          rate: number;
        }[]
      | [];
    payments:
      | {
          date: string;
          type: PaymentMethod;
          reference: string;
          amount: number;
        }[]
      | [];
    description: string;
  };

  export type Tenant = {
    _id: string;
    realmId: string | Realm;
    name: string;
    isCompany: boolean;
    company: string;
    manager: string;
    legalForm: string;
    siret: string;
    rcs: string;
    capital: number;
    street1: string;
    street2: string;
    zipCode: string;
    city: string;
    country: string;
    contacts: {
      contact: string;
      phone: string;
      email: string;
    }[];
    reference: string;
    contract: string;
    leaseId: string | Lease;
    beginDate: Date;
    endDate: Date;
    terminationDate: Date;
    properties:
      | {
          propertyId: string;
          property: CollectionTypes.Property;
          rent: number;
          expenses: [
            { title: string; amount: number; beginDate: Date; endDate: Date }
          ];
          entryDate: Date;
          exitDate: Date;
        }[]
      | [];
    rents: PartRent[] | [];
    isVat: boolean;
    vatRatio: number;
    discount: number;
    guaranty: number;
    guarantyPayback: number;

    stepperMode: boolean;
  };

  export type Attachment = {
    _id: string;
    realmId: string;
    targetType:
      | 'property'
      | 'note'
      | 'project'
      | 'contact'
      | 'tenant'
      | 'contractor'
      | 'contract';
    targetId: string;
    storageKey: string;
    filename: string;
    mimeType: string;
    size: number;
    category:
      | 'property_photo'
      | 'property_record'
      | 'property_map'
      | 'note_attachment'
      | 'project_attachment'
      | 'other';
    uploadedById: string;
    uploadedByName?: string;
    backupProvider: 'onedrive' | null;
    backupPath: string | null;
    backupStatus: 'pending' | 'success' | 'failed' | null;
    backupLastTriedAt: Date | null;
    backupError: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  export type NoteAttachment = {
    _id?: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string; // where the file is stored (path/key)
    uploadedBy: string; // userId
    uploadedAt: Date;
  };

  export type NoteEntityType =
    | 'property'
    | 'contact'
    | 'contract'
    | 'project'
    | 'contractor';

  export type Note = {
    _id?: string;
    realmId?: string; // optional now; we'll decide in next steps if we enforce it
    entityType: NoteEntityType;
    entityId: string; // ObjectId string
    authorId: string; // ObjectId string
    authorName?: string;
    content: string;
    tags?: string[];
    pinned?: boolean;
    attachments?: NoteAttachment[];
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type Contractor = {
    _id?: string;
    realmId: string;
    name: string;
    isCompany?: boolean;
    company?: string;
    manager?: string;
    legalForm?: string;
    siret?: string;
    rcs?: string;
    capital?: number;
    street1?: string;
    street2?: string;
    zipCode?: string;
    city?: string;
    country?: string;
    contacts?: {
      contact?: string;
      phone?: string;
      email?: string;
    }[];
    businessType?: string;
    insurance?: string;
    licenseNumber?: string;
    taxId?: string;
    notes?: string;
    active?: boolean;
    rating?: number;
    createdDate?: Date;
    updatedDate?: Date;
  };

  export type ContractorWork = {
    _id?: string;
    realmId: string;
    contractorId: string;
    propertyId?: string;
    projectId?: string;
    title: string;
    description?: string;
    workType?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    startDate?: Date;
    completionDate?: Date;
    dueDate?: Date;
    estimatedCost?: number;
    actualCost?: number;
    currency?: string;
    paymentStatus?: 'unpaid' | 'partial' | 'paid';
    paidDate?: Date;
    receiptUrl?: string;
    receiptFileName?: string;
    bidUrl?: string;
    bidFileName?: string;
    invoiceUrl?: string;
    invoiceFileName?: string;
    attachments?: {
      fileName?: string;
      fileUrl?: string;
      uploadedAt?: Date;
      uploadedBy?: string;
    }[];
    notes?: string;
    internalNotes?: string;
    createdDate?: Date;
    updatedDate?: Date;
  };

  export type Project = {
    _id: string;
    realmId: string;
    targetType: 'property' | 'contact' | 'tenant' | 'contractor';
    targetId: string;
    title: string;
    description: string;
    status: 'planned' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
    startDate: Date | null;
    endDate: Date | null;
    completedDate: Date | null;
    estimatedCost: number | null;
    actualCost: number | null;
    currency: string;
    createdById: string;
    createdByName?: string;
    contractorId: string | null;
    contractorName: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}
