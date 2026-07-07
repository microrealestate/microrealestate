import { LeaseInstanceStatus, LeaseTimeRange, Locale, PaymentMethod, UserRole } from './index.js';
export type MongooseDocument<T> = {
    __v: number;
    save: () => Promise<T>;
    toObject: () => T;
} & T;
export declare namespace CollectionTypes {
    type PartAddress = {
        street1: string;
        street2?: string;
        zipCode: string;
        city: string;
        state?: string;
        country: string;
    };
    type Account = {
        _id: string;
        firstname: string;
        lastname: string;
        email: string;
        password: string;
        passwordChangeRequired?: boolean;
        createdDate?: Date;
    };
    type Realm = {
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
            graph: {
                selected: boolean;
                tenantId: string;
                clientId: string;
                clientSecret: string;
                senderEmail: string;
                fromEmail: string;
                replyToEmail: string;
            };
            utilitiesInboxGraph?: {
                selected?: boolean;
                tenantId?: string;
                clientId?: string;
                clientSecret?: string;
                mailboxEmail?: string;
                notificationEmails?: string[];
                pollingEnabled?: boolean;
                pollingHourUtc?: number;
                clientSecretUpdated?: boolean;
                lastSuccessfulSyncAt?: Date | null;
                lastSyncAt?: Date | null;
                lastSyncError?: string;
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
    type Document = {
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
    type Email = {
        _id: string;
        templateName: string;
        recordId: string;
        params: Record<string, never>;
        sentTo: string;
        sentDate: Date;
        status: string;
        emailId: string;
    };
    type Lease = {
        _id: string;
        realmId: string;
        name: string;
        description: string;
        numberOfTerms: number;
        timeRange: LeaseTimeRange;
        active: boolean;
        stepperMode: boolean;
        lastUpdatedBy?: string;
    };
    type Property = {
        _id: string;
        realmId: string;
        type: string;
        name: string;
        description: string;
        surface: number;
        phone: string;
        digicode: string;
        address: CollectionTypes.PartAddress;
        price: number;
        parentPropertyId?: string | null;
        rentLowSqftYear?: number | null;
        rentMedianSqftYear?: number | null;
        rentHighSqftYear?: number | null;
        taxId?: string | null;
        countyRecordsReference?: string | null;
        coverPhotoAttachmentId?: string | null;
        floorPlanAttachmentId?: string | null;
        lastUpdatedBy?: string;
        building: string;
        level: string;
        location: string;
    };
    type Template = {
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
    type PartRent = {
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
        preTaxAmounts: {
            amount: number;
            description: string;
        }[] | [];
        charges: {
            amount: number;
            description: string;
        }[] | [];
        debts: {
            amount: number;
            description: string;
        }[] | [];
        discounts: {
            origin: 'contract' | 'settlement';
            amount: number;
            description: string;
        }[] | [];
        vats: {
            origin: 'contract' | 'settlement';
            amount: number;
            description: string;
            rate: number;
        }[] | [];
        payments: {
            date: string;
            type: PaymentMethod;
            reference: string;
            amount: number;
        }[] | [];
        description: string;
    };
    type Tenant = {
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
        properties: {
            propertyId: string;
            property: CollectionTypes.Property;
            rent: number;
            expenses: [
                {
                    title: string;
                    amount: number;
                    beginDate: Date;
                    endDate: Date;
                }
            ];
            entryDate: Date;
            exitDate: Date;
        }[] | [];
        rents: PartRent[] | [];
        isVat: boolean;
        vatRatio: number;
        discount: number;
        guaranty: number;
        guarantyPayback: number;
        /** Invoice email address for future billing use. Separate from contacts[].email. */
        invoiceEmail?: string;
        stepperMode: boolean;
    };
    type Attachment = {
        _id: string;
        realmId: string;
        targetType: 'property' | 'utility_account' | 'property_tax_statement' | 'utility' | 'note' | 'project' | 'contact' | 'tenant' | 'contractor' | 'contractor_work' | 'contract' | 'lease_instance';
        targetId: string;
        storageKey: string;
        filename: string;
        mimeType: string;
        size: number;
        category: 'property_cover' | 'property_photo' | 'property_floor_plan' | 'property_album_photo' | 'property_record' | 'county_record' | 'property_map' | 'utility_bill' | 'tax_payment_confirmation' | 'note_attachment' | 'project_attachment' | 'work_record_attachment' | 'other';
        albumName?: string | null;
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
    type NoteAttachment = {
        _id?: string;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
        storageKey: string;
        uploadedBy: string;
        uploadedAt: Date;
    };
    type NoteEntityType = 'property' | 'contact' | 'contract' | 'project' | 'contractor' | 'property_tax_statement';
    type Note = {
        _id?: string;
        realmId?: string;
        entityType: NoteEntityType;
        entityId: string;
        authorId: string;
        authorName?: string;
        content: string;
        tags?: string[];
        pinned?: boolean;
        attachments?: NoteAttachment[];
        deletedAt?: Date | null;
        createdAt?: Date;
        updatedAt?: Date;
    };
    type Contractor = {
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
        reviews?: {
            rating: number;
            comment?: string;
            authorId?: string;
            authorName?: string;
            createdAt?: Date;
        }[];
        createdDate?: Date;
        updatedDate?: Date;
    };
    type ContractorWork = {
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
    type Project = {
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
    type UtilitySplit = {
        subPropertyId: string;
        splitType: 'percentage' | 'equal';
        percentage?: number;
    };
    type UtilityAccountAllocation = {
        propertyId: string;
        percentage: number;
    };
    type UtilityAccountAllocationHistory = {
        changedAt: Date;
        changedBy?: string;
        previousAllocations: UtilityAccountAllocation[];
        nextAllocations: UtilityAccountAllocation[];
    };
    type UtilityAccount = {
        _id?: string;
        realmId: string;
        type: string;
        provider?: string;
        accountNumber: string;
        notes?: string;
        allocations: UtilityAccountAllocation[];
        allocationHistory?: UtilityAccountAllocationHistory[];
        createdAt?: Date;
        updatedAt?: Date;
    };
    type Utility = {
        _id?: string;
        realmId: string;
        propertyId: string;
        type: string;
        provider?: string;
        accountNumber?: string;
        billingMonth: string;
        amount: number;
        dueDate?: Date | null;
        paidDate?: Date | null;
        notes?: string;
        attachmentIds?: string[];
        status?: 'confirmed' | 'pending';
        source?: 'manual' | 'email';
        confirmationNumber?: string;
        emailMessageId?: string;
        importIssues?: string[];
        splitMethod: 'equal' | 'percentage';
        splitItems: UtilitySplit[];
        originalAmount?: number;
        splitTotal?: number;
        sourceUtilityId?: string;
        invoicedAt?: Date | null;
        invoicedBy?: string;
        billEnteredAt?: Date;
        billEnteredBy?: string;
        lastUpdatedBy?: string;
        createdAt?: Date;
        updatedAt?: Date;
    };
    type UtilityInvoice = {
        _id?: string;
        realmId: string;
        utilityId: string;
        propertyId: string;
        occupantId: string;
        occupantEmail: string;
        billingMonth: string;
        invoiceAmount: number;
        invoiceNumber: string;
        status: 'draft' | 'sent' | 'outstanding' | 'paid' | 'void';
        createdAt?: Date;
        sentAt?: Date | null;
        sentBy?: string;
        paidAt?: Date | null;
        paidBy?: string;
        voidedAt?: Date | null;
        voidedBy?: string;
        attachmentId?: string;
        emailMessageId?: string;
        paymentMethod?: string;
        paymentReference?: string;
        paymentNotes?: string;
        dueDate?: Date;
        updatedAt?: Date;
    };
    type UtilityActivity = {
        _id?: string;
        realmId: string;
        utilityId: string;
        eventType: 'split_created' | 'qb_posted' | 'invoiced' | 'invoice_sent' | 'payment_received';
        actor: string;
        timestamp: Date;
        details?: {
            splitMethod?: 'equal' | 'percentage';
            splitCount?: number;
            qbPostedAt?: Date;
            qbReference?: string;
            invoiceIds?: string[];
            invoiceId?: string;
            paidAmount?: number;
            paymentMethod?: string;
            paymentReference?: string;
        };
        notes?: string;
        createdAt?: Date;
    };
    type PropertyTaxUnitSplit = {
        subPropertyId: string;
        percentage: number;
    };
    type PropertyTaxPaymentConfirmation = {
        paidOn: Date;
        paidAmount: number;
        feeAmount?: number;
        paymentMethod?: string;
        confirmationNumber?: string;
        notes?: string;
        attachmentIds?: string[];
        createdAt?: Date;
        createdBy?: string;
    };
    /**
     * LeaseInstance — an actual lease record tracking lifecycle from draft → active → expired.
     * This is separate from the legacy Lease template model used by the rent-generation workflow.
     */
    type LeaseInstance = {
        _id: string;
        realmId: string;
        /** Current lifecycle status */
        status: LeaseInstanceStatus;
        /** Lease start date (required before activation) */
        startDate?: Date;
        /** Lease end date (required before activation) */
        endDate?: Date;
        /** Timestamp when the lease was activated (draft → active transition) */
        activatedAt?: Date;
        /** IDs of Tenant documents associated with this lease */
        tenantIds: string[];
        /** ID of the Property (or unit) this lease is for (required before activation) */
        propertyId?: string;
        /** Attachment IDs for draft lease files (Word docs, unsigned PDFs) */
        draftDocumentIds: string[];
        /** Attachment ID for the signed lease document (required before activation) */
        signedDocumentId?: string;
        /** Optional free-text notes */
        notes?: string;
        /** Invoice email address (for future invoicing — do not use for billing logic) */
        invoiceEmail?: string;
        /** Audit: who last modified this record */
        lastUpdatedBy?: string;
        createdAt?: Date;
        updatedAt?: Date;
    };
    type PropertyTaxStatement = {
        _id?: string;
        realmId: string;
        propertyId: string;
        taxYearLabel: string;
        periodStart?: Date | null;
        periodEnd?: Date | null;
        county?: string;
        accountNumber?: string;
        mapNumber?: string;
        rmvLandLastYear?: number;
        rmvLandThisYear?: number;
        rmvBuildingLastYear?: number;
        rmvBuildingThisYear?: number;
        rmvTotalLastYear?: number;
        rmvTotalThisYear?: number;
        assessedValueLastYear?: number;
        assessedValueThisYear?: number;
        propertyTaxesLastYear?: number;
        propertyTaxesThisYear?: number;
        taxBeforeDiscount?: number;
        delinquentTaxes?: number;
        totalAfterDiscount?: number;
        landLeasedPercentage?: number;
        buildingUnitSplits?: PropertyTaxUnitSplit[];
        landUnitSplits?: PropertyTaxUnitSplit[];
        estimatedIncreasePercentage?: number;
        estimatedNextYearTotal?: number;
        estimatedMonthlyCost?: number;
        priorYearEstimatedTotal?: number | null;
        priorYearVariance?: number | null;
        notes?: string;
        attachmentIds?: string[];
        paymentConfirmations?: PropertyTaxPaymentConfirmation[];
        lastUpdatedBy?: string;
        createdAt?: Date;
        updatedAt?: Date;
    };
}
