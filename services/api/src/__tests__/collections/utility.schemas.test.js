/* eslint-env node, jest */
import mongoose from 'mongoose';
import { Collections } from '@microrealestate/common';

const { Utility } = Collections;

describe('Utility schema - Phase 1 enhancements', () => {
  let realmId;
  let propertyId;

  beforeAll(() => {
    realmId = new mongoose.Types.ObjectId().toString();
    propertyId = new mongoose.Types.ObjectId().toString();
  });

  describe('originalAmount field', () => {
    it('should accept originalAmount as optional field', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: [],
        originalAmount: 100
      };

      const utility = new Utility(utilityData);
      expect(utility.originalAmount).toBe(100);
    });

    it('should default originalAmount to null if not provided', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: []
      };

      const utility = new Utility(utilityData);
      expect(utility.originalAmount).toBeNull();
    });

    it('should preserve originalAmount with split amount', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'gas',
        billingMonth: '2024-02',
        amount: 50,
        originalAmount: 150,
        splitMethod: 'equal',
        splitItems: []
      };

      const utility = new Utility(utilityData);
      expect(utility.originalAmount).toBe(150);
      expect(utility.amount).toBe(50);
    });
  });

  describe('splitTotal field', () => {
    it('should accept splitTotal as optional field', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: [],
        splitTotal: 100
      };

      const utility = new Utility(utilityData);
      expect(utility.splitTotal).toBe(100);
    });

    it('should default splitTotal to null if not provided', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: []
      };

      const utility = new Utility(utilityData);
      expect(utility.splitTotal).toBeNull();
    });

    it('should track sum of split items', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'water',
        billingMonth: '2024-03',
        amount: 200,
        splitMethod: 'equal',
        splitItems: [],
        originalAmount: 200,
        splitTotal: 200
      };

      const utility = new Utility(utilityData);
      expect(utility.splitTotal).toBe(200);
    });
  });

  describe('invoicedAt field', () => {
    it('should default invoicedAt to null', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: []
      };

      const utility = new Utility(utilityData);
      expect(utility.invoicedAt).toBeNull();
    });

    it('should accept invoicedAt as Date', () => {
      const invoicedDate = new Date();
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: [],
        invoicedAt: invoicedDate,
        invoicedBy: 'user@example.com'
      };

      const utility = new Utility(utilityData);
      expect(utility.invoicedAt).toEqual(invoicedDate);
      expect(utility.invoicedBy).toBe('user@example.com');
    });

    it('should lock bill once invoicedAt is set', () => {
      const invoicedDate = new Date();
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: [],
        invoicedAt: invoicedDate,
        invoicedBy: 'finance@example.com',
        status: 'confirmed'
      };

      const utility = new Utility(utilityData);
      expect(utility.invoicedAt).toBeDefined();
      expect(utility.invoicedBy).toBe('finance@example.com');
    });
  });

  describe('sourceUtilityId field', () => {
    it('should default sourceUtilityId to empty string', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: []
      };

      const utility = new Utility(utilityData);
      expect(utility.sourceUtilityId).toBe('');
    });

    it('should accept sourceUtilityId as parent bill reference', () => {
      const parentBillId = new mongoose.Types.ObjectId().toString();
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 50,
        splitMethod: 'equal',
        splitItems: [],
        sourceUtilityId: parentBillId
      };

      const utility = new Utility(utilityData);
      expect(utility.sourceUtilityId).toBe(parentBillId);
    });
  });

  describe('billEnteredAt field', () => {
    it('should default billEnteredAt to current date', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: []
      };

      const utility = new Utility(utilityData);
      expect(utility.billEnteredAt).toBeDefined();
      expect(utility.billEnteredAt).toBeInstanceOf(Date);
    });

    it('should accept custom billEnteredAt', () => {
      const enteredDate = new Date('2024-01-01');
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: [],
        billEnteredAt: enteredDate,
        billEnteredBy: 'clerk@example.com'
      };

      const utility = new Utility(utilityData);
      expect(utility.billEnteredAt).toEqual(enteredDate);
      expect(utility.billEnteredBy).toBe('clerk@example.com');
    });
  });

  describe('backward compatibility', () => {
    it('should accept utility without new fields', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: []
      };

      const utility = new Utility(utilityData);
      expect(utility.amount).toBe(100);
      expect(utility.originalAmount).toBeNull();
      expect(utility.splitTotal).toBeNull();
      expect(utility.invoicedAt).toBeNull();
      expect(utility.billEnteredAt).toBeDefined();
    });

    it('should preserve existing fields with new fields', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        provider: 'Power Co',
        accountNumber: 'ACC-123',
        billingMonth: '2024-01',
        amount: 100,
        dueDate: new Date('2024-02-01'),
        status: 'confirmed',
        source: 'manual',
        confirmationNumber: 'ABC123',
        notes: 'Test note',
        splitMethod: 'equal',
        splitItems: [],
        originalAmount: 100,
        lastUpdatedBy: 'user@example.com'
      };

      const utility = new Utility(utilityData);
      expect(utility.provider).toBe('Power Co');
      expect(utility.accountNumber).toBe('ACC-123');
      expect(utility.status).toBe('confirmed');
      expect(utility.source).toBe('manual');
      expect(utility.confirmationNumber).toBe('ABC123');
      expect(utility.notes).toBe('Test note');
      expect(utility.originalAmount).toBe(100);
      expect(utility.lastUpdatedBy).toBe('user@example.com');
    });

    it('should handle split items with new fields', () => {
      const subPropertyId = new mongoose.Types.ObjectId().toString();
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 50,
        originalAmount: 100,
        splitTotal: 100,
        splitMethod: 'percentage',
        splitItems: [
          {
            subPropertyId,
            splitType: 'percentage',
            percentage: 50
          }
        ]
      };

      const utility = new Utility(utilityData);
      expect(utility.splitItems).toHaveLength(1);
      expect(utility.originalAmount).toBe(100);
      expect(utility.splitTotal).toBe(100);
    });
  });

  describe('validation', () => {
    it('should require realmId, propertyId, billingMonth, and amount', () => {
      const utility = new Utility({
        type: 'electric',
        splitMethod: 'equal',
        splitItems: []
      });

      expect(utility.validateSync()).toBeDefined();
    });

    it('should accept valid full record with new fields', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        originalAmount: 100,
        splitTotal: 100,
        splitMethod: 'equal',
        splitItems: [],
        invoicedAt: new Date(),
        invoicedBy: 'user@example.com',
        billEnteredAt: new Date(),
        billEnteredBy: 'clerk@example.com',
        lastUpdatedBy: 'user@example.com'
      };

      const utility = new Utility(utilityData);
      expect(utility.validateSync()).toBeUndefined();
    });
  });

  describe('timestamps', () => {
    it('should have createdAt and updatedAt timestamps', () => {
      const utilityData = {
        realmId,
        propertyId,
        type: 'electric',
        billingMonth: '2024-01',
        amount: 100,
        splitMethod: 'equal',
        splitItems: []
      };

      const utility = new Utility(utilityData);
      expect(utility.createdAt).toBeUndefined(); // Not set until saved
      expect(utility.updatedAt).toBeUndefined();
    });
  });
});
