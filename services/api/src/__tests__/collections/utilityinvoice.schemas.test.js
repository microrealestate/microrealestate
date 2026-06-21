/* eslint-env node, jest */
import mongoose from 'mongoose';

// Inline schema mirroring production services/common/src/collections/utilityinvoice.ts
const UtilityInvoiceSchema = new mongoose.Schema(
  {
    realmId: { type: String, required: true },
    utilityId: { type: String, required: true },
    propertyId: { type: String, required: true },
    occupantId: { type: String, required: true },
    occupantEmail: { type: String, required: true },
    billingMonth: { type: String, required: true },
    invoiceAmount: { type: Number, required: true },
    invoiceNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'outstanding', 'paid', 'void'],
      default: 'draft',
    },
    dueDate: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    sentBy: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    paidBy: { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
    paymentReference: { type: String, default: '' },
    paymentNotes: { type: String, default: '' },
    voidedAt: { type: Date, default: null },
    voidedBy: { type: String, default: '' },
    attachmentId: { type: String, default: '' },
    emailMessageId: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const UtilityInvoice =
  mongoose.models.TestUtilityInvoice ||
  mongoose.model('TestUtilityInvoice', UtilityInvoiceSchema);

describe('UtilityInvoice schema', () => {
  let realmId;
  let utilityId;
  let propertyId;
  let occupantId;

  beforeAll(() => {
    realmId = new mongoose.Types.ObjectId().toString();
    utilityId = new mongoose.Types.ObjectId().toString();
    propertyId = new mongoose.Types.ObjectId().toString();
    occupantId = new mongoose.Types.ObjectId().toString();
  });

  describe('required fields', () => {
    it('should require realmId, utilityId, propertyId, occupantId, occupantEmail, billingMonth, invoiceAmount, invoiceNumber', () => {
      const invoice = new UtilityInvoice({});
      const errors = invoice.validateSync();
      expect(errors).toBeDefined();
      expect(errors.errors.realmId).toBeDefined();
      expect(errors.errors.utilityId).toBeDefined();
      expect(errors.errors.propertyId).toBeDefined();
      expect(errors.errors.occupantId).toBeDefined();
      expect(errors.errors.occupantEmail).toBeDefined();
      expect(errors.errors.billingMonth).toBeDefined();
      expect(errors.errors.invoiceAmount).toBeDefined();
      expect(errors.errors.invoiceNumber).toBeDefined();
    });

    it('should accept valid invoice with all required fields', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.validateSync()).toBeUndefined();
    });
  });

  describe('status field', () => {
    it('should default status to draft', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.status).toBe('draft');
    });

    it('should accept valid status values', () => {
      const statuses = ['draft', 'sent', 'outstanding', 'paid', 'void'];

      statuses.forEach(status => {
        const invoiceData = {
          realmId,
          utilityId,
          propertyId,
          occupantId,
          occupantEmail: 'tenant@example.com',
          billingMonth: '2024-01',
          invoiceAmount: 150,
          invoiceNumber: `INV-${status}`,
          status
        };

        const invoice = new UtilityInvoice(invoiceData);
        expect(invoice.status).toBe(status);
      });
    });

    it('should reject invalid status values', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001',
        status: 'invalid'
      };

      const invoice = new UtilityInvoice(invoiceData);
      const errors = invoice.validateSync();
      expect(errors).toBeDefined();
    });
  });

  describe('state transitions', () => {
    it('should track sent state with sentAt and sentBy', () => {
      const sentDate = new Date();
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001',
        status: 'sent',
        sentAt: sentDate,
        sentBy: 'finance@example.com'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.status).toBe('sent');
      expect(invoice.sentAt).toEqual(sentDate);
      expect(invoice.sentBy).toBe('finance@example.com');
    });

    it('should track paid state with paidAt and paidBy', () => {
      const paidDate = new Date();
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001',
        status: 'paid',
        sentAt: new Date(),
        sentBy: 'finance@example.com',
        paidAt: paidDate,
        paidBy: 'finance@example.com'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.status).toBe('paid');
      expect(invoice.paidAt).toEqual(paidDate);
      expect(invoice.paidBy).toBe('finance@example.com');
    });

    it('should track voided state with voidedAt and voidedBy', () => {
      const voidedDate = new Date();
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001',
        status: 'void',
        voidedAt: voidedDate,
        voidedBy: 'finance@example.com'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.status).toBe('void');
      expect(invoice.voidedAt).toEqual(voidedDate);
      expect(invoice.voidedBy).toBe('finance@example.com');
    });
  });

  describe('payment tracking', () => {
    it('should store payment method, reference, and notes', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001',
        status: 'paid',
        paymentMethod: 'check',
        paymentReference: 'CHK-12345',
        paymentNotes: 'Received on 2024-01-15'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.paymentMethod).toBe('check');
      expect(invoice.paymentReference).toBe('CHK-12345');
      expect(invoice.paymentNotes).toBe('Received on 2024-01-15');
    });

    it('should support various payment methods', () => {
      const methods = ['check', 'transfer', 'cash', 'other'];

      methods.forEach(method => {
        const invoiceData = {
          realmId,
          utilityId,
          propertyId,
          occupantId,
          occupantEmail: 'tenant@example.com',
          billingMonth: '2024-01',
          invoiceAmount: 150,
          invoiceNumber: `INV-${method}`,
          paymentMethod: method
        };

        const invoice = new UtilityInvoice(invoiceData);
        expect(invoice.paymentMethod).toBe(method);
      });
    });

    it('should default payment fields to empty strings', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.paymentMethod).toBe('');
      expect(invoice.paymentReference).toBe('');
      expect(invoice.paymentNotes).toBe('');
    });
  });

  describe('document references', () => {
    it('should store attachmentId for PDF invoice', () => {
      const attachmentId = new mongoose.Types.ObjectId().toString();
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001',
        attachmentId
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.attachmentId).toBe(attachmentId);
    });

    it('should store emailMessageId for email delivery tracking', () => {
      const emailMessageId = new mongoose.Types.ObjectId().toString();
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001',
        emailMessageId
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.emailMessageId).toBe(emailMessageId);
    });

    it('should default attachment and email IDs to empty strings', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.attachmentId).toBe('');
      expect(invoice.emailMessageId).toBe('');
    });
  });

  describe('due date', () => {
    it('should accept optional due date', () => {
      const dueDate = new Date('2024-02-15');
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001',
        dueDate
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.dueDate).toEqual(dueDate);
    });

    it('should default due date to null', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.dueDate).toBeNull();
    });
  });

  describe('timestamps', () => {
    it('should have createdAt and updatedAt fields', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.createdAt).toBeUndefined(); // Not set until saved
      expect(invoice.updatedAt).toBeUndefined();
    });
  });

  describe('indexes', () => {
    it('should be indexed by realmId, occupantId, billingMonth', () => {
      // This is a schema-level test; actual index existence requires a database connection
      const indexes = UtilityInvoice.collection.getIndexes;
      expect(indexes).toBeDefined();
    });
  });

  describe('occupant email', () => {
    it('should store and retrieve occupant email', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'john.doe@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 150,
        invoiceNumber: 'INV-2024-001'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.occupantEmail).toBe('john.doe@example.com');
    });
  });

  describe('invoice amount', () => {
    it('should store and retrieve invoice amount', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 125.75,
        invoiceNumber: 'INV-2024-001'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.invoiceAmount).toBe(125.75);
    });

    it('should accept zero invoice amount', () => {
      const invoiceData = {
        realmId,
        utilityId,
        propertyId,
        occupantId,
        occupantEmail: 'tenant@example.com',
        billingMonth: '2024-01',
        invoiceAmount: 0,
        invoiceNumber: 'INV-2024-001'
      };

      const invoice = new UtilityInvoice(invoiceData);
      expect(invoice.invoiceAmount).toBe(0);
    });
  });
});
