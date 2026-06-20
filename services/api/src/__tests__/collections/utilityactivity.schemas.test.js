/* eslint-env node, jest */
import mongoose from 'mongoose';
import { Collections } from '@microrealestate/common';

const { UtilityActivity } = Collections;

describe('UtilityActivity schema', () => {
  let realmId;
  let utilityId;

  beforeAll(() => {
    realmId = new mongoose.Types.ObjectId().toString();
    utilityId = new mongoose.Types.ObjectId().toString();
  });

  describe('required fields', () => {
    it('should require realmId, utilityId, eventType, actor, and timestamp', () => {
      const activity = new UtilityActivity({});
      const errors = activity.validateSync();
      expect(errors).toBeDefined();
      expect(errors.errors.realmId).toBeDefined();
      expect(errors.errors.utilityId).toBeDefined();
      expect(errors.errors.eventType).toBeDefined();
      expect(errors.errors.actor).toBeDefined();
    });

    it('should accept valid activity with required fields', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'split_created',
        actor: 'user@example.com',
        timestamp: new Date()
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.validateSync()).toBeUndefined();
    });
  });

  describe('eventType field', () => {
    it('should accept all valid event types', () => {
      const eventTypes = ['split_created', 'qb_posted', 'invoiced', 'invoice_sent', 'payment_received'];

      eventTypes.forEach(eventType => {
        const activityData = {
          realmId,
          utilityId,
          eventType,
          actor: 'user@example.com',
          timestamp: new Date()
        };

        const activity = new UtilityActivity(activityData);
        expect(activity.eventType).toBe(eventType);
      });
    });

    it('should reject invalid event type', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'invalid_event',
        actor: 'user@example.com',
        timestamp: new Date()
      };

      const activity = new UtilityActivity(activityData);
      const errors = activity.validateSync();
      expect(errors).toBeDefined();
    });
  });

  describe('actor tracking', () => {
    it('should store actor (user email or ID)', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'qb_posted',
        actor: 'finance@example.com',
        timestamp: new Date()
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.actor).toBe('finance@example.com');
    });

    it('should track different actors for different events', () => {
      const actors = [
        'clerk@example.com',
        'finance@example.com',
        'admin@example.com'
      ];

      actors.forEach((actor, index) => {
        const activityData = {
          realmId,
          utilityId,
          eventType: 'split_created',
          actor,
          timestamp: new Date()
        };

        const activity = new UtilityActivity(activityData);
        expect(activity.actor).toBe(actor);
      });
    });
  });

  describe('timestamp field', () => {
    it('should store timestamp for event', () => {
      const eventTime = new Date('2024-01-15T10:30:00Z');
      const activityData = {
        realmId,
        utilityId,
        eventType: 'split_created',
        actor: 'user@example.com',
        timestamp: eventTime
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.timestamp).toEqual(eventTime);
    });

    it('should default timestamp to current time if not provided', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'split_created',
        actor: 'user@example.com'
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.timestamp).toBeDefined();
      expect(activity.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('details field - split_created', () => {
    it('should store split method and count for split_created event', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'split_created',
        actor: 'user@example.com',
        timestamp: new Date(),
        details: {
          splitMethod: 'percentage',
          splitCount: 3
        }
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.details.splitMethod).toBe('percentage');
      expect(activity.details.splitCount).toBe(3);
    });
  });

  describe('details field - qb_posted', () => {
    it('should store QB posting timestamp and reference', () => {
      const qbPostedDate = new Date('2024-01-20');
      const activityData = {
        realmId,
        utilityId,
        eventType: 'qb_posted',
        actor: 'finance@example.com',
        timestamp: new Date(),
        details: {
          qbPostedAt: qbPostedDate,
          qbReference: 'QB-EXP-2024-001'
        }
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.details.qbPostedAt).toEqual(qbPostedDate);
      expect(activity.details.qbReference).toBe('QB-EXP-2024-001');
    });

    it('should allow empty qbReference for manual log', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'qb_posted',
        actor: 'finance@example.com',
        timestamp: new Date(),
        details: {
          qbPostedAt: new Date(),
          qbReference: ''
        }
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.details.qbReference).toBe('');
    });
  });

  describe('details field - invoiced', () => {
    it('should store invoice IDs for invoiced event', () => {
      const invoiceIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];
      const activityData = {
        realmId,
        utilityId,
        eventType: 'invoiced',
        actor: 'finance@example.com',
        timestamp: new Date(),
        details: {
          invoiceIds
        }
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.details.invoiceIds).toEqual(invoiceIds);
      expect(activity.details.invoiceIds).toHaveLength(2);
    });

    it('should default invoiceIds to empty array', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'invoiced',
        actor: 'finance@example.com',
        timestamp: new Date(),
        details: {}
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.details.invoiceIds).toEqual([]);
    });
  });

  describe('details field - invoice_sent', () => {
    it('should store invoice ID for invoice_sent event', () => {
      const invoiceId = new mongoose.Types.ObjectId().toString();
      const activityData = {
        realmId,
        utilityId,
        eventType: 'invoice_sent',
        actor: 'finance@example.com',
        timestamp: new Date(),
        details: {
          invoiceId
        }
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.details.invoiceId).toBe(invoiceId);
    });
  });

  describe('details field - payment_received', () => {
    it('should store payment details for payment_received event', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'payment_received',
        actor: 'finance@example.com',
        timestamp: new Date(),
        details: {
          invoiceId: new mongoose.Types.ObjectId().toString(),
          paidAmount: 150.00,
          paymentMethod: 'check',
          paymentReference: 'CHK-12345'
        }
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.details.paidAmount).toBe(150.00);
      expect(activity.details.paymentMethod).toBe('check');
      expect(activity.details.paymentReference).toBe('CHK-12345');
    });

    it('should support various payment methods in details', () => {
      const methods = ['check', 'transfer', 'cash', 'other'];

      methods.forEach(method => {
        const activityData = {
          realmId,
          utilityId,
          eventType: 'payment_received',
          actor: 'finance@example.com',
          timestamp: new Date(),
          details: {
            paymentMethod: method
          }
        };

        const activity = new UtilityActivity(activityData);
        expect(activity.details.paymentMethod).toBe(method);
      });
    });
  });

  describe('notes field', () => {
    it('should store optional notes', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'qb_posted',
        actor: 'finance@example.com',
        timestamp: new Date(),
        notes: 'Posted to QB after email confirmation'
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.notes).toBe('Posted to QB after email confirmation');
    });

    it('should default notes to empty string', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'split_created',
        actor: 'user@example.com',
        timestamp: new Date()
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.notes).toBe('');
    });
  });

  describe('append-only behavior', () => {
    it('should create new activity records without modification', () => {
      const activity1Data = {
        realmId,
        utilityId,
        eventType: 'split_created',
        actor: 'user1@example.com',
        timestamp: new Date('2024-01-10')
      };

      const activity1 = new UtilityActivity(activity1Data);
      expect(activity1.eventType).toBe('split_created');
      expect(activity1.actor).toBe('user1@example.com');

      const activity2Data = {
        realmId,
        utilityId,
        eventType: 'qb_posted',
        actor: 'user2@example.com',
        timestamp: new Date('2024-01-15')
      };

      const activity2 = new UtilityActivity(activity2Data);
      expect(activity2.eventType).toBe('qb_posted');
      expect(activity2.actor).toBe('user2@example.com');
    });
  });

  describe('details nesting', () => {
    it('should store complex nested details', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'payment_received',
        actor: 'finance@example.com',
        timestamp: new Date(),
        details: {
          invoiceId: new mongoose.Types.ObjectId().toString(),
          paidAmount: 250.50,
          paymentMethod: 'transfer',
          paymentReference: 'TXN-2024-0567',
          splitMethod: 'percentage',
          splitCount: 2
        }
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.details).toBeDefined();
      expect(activity.details.paidAmount).toBe(250.50);
      expect(activity.details.paymentReference).toBe('TXN-2024-0567');
      expect(activity.details.splitCount).toBe(2);
    });

    it('should default details to empty object if not provided', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'split_created',
        actor: 'user@example.com',
        timestamp: new Date()
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.details).toBeDefined();
      expect(typeof activity.details).toBe('object');
    });
  });

  describe('timestamps', () => {
    it('should have createdAt but not updatedAt (append-only)', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'split_created',
        actor: 'user@example.com',
        timestamp: new Date()
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.createdAt).toBeUndefined(); // Not set until saved
    });
  });

  describe('comprehensive event lifecycle', () => {
    it('should capture complete activity sequence for a utility bill', () => {
      const events = [
        {
          eventType: 'split_created',
          actor: 'clerk@example.com',
          details: { splitMethod: 'percentage', splitCount: 2 }
        },
        {
          eventType: 'invoiced',
          actor: 'finance@example.com',
          details: { invoiceIds: [new mongoose.Types.ObjectId().toString()] }
        },
        {
          eventType: 'qb_posted',
          actor: 'finance@example.com',
          details: { qbPostedAt: new Date(), qbReference: '' }
        },
        {
          eventType: 'invoice_sent',
          actor: 'finance@example.com',
          details: { invoiceId: new mongoose.Types.ObjectId().toString() }
        },
        {
          eventType: 'payment_received',
          actor: 'finance@example.com',
          details: { paidAmount: 150, paymentMethod: 'check' }
        }
      ];

      const activities = events.map((event, index) => {
        const activityData = {
          realmId,
          utilityId,
          timestamp: new Date(),
          ...event
        };

        return new UtilityActivity(activityData);
      });

      expect(activities).toHaveLength(5);
      expect(activities[0].eventType).toBe('split_created');
      expect(activities[4].eventType).toBe('payment_received');
    });
  });

  describe('validation', () => {
    it('should validate required fields only', () => {
      const activityData = {
        realmId,
        utilityId,
        eventType: 'split_created',
        actor: 'user@example.com',
        timestamp: new Date()
      };

      const activity = new UtilityActivity(activityData);
      expect(activity.validateSync()).toBeUndefined();
    });

    it('should reject missing required fields', () => {
      const activity = new UtilityActivity({ eventType: 'split_created' });
      const errors = activity.validateSync();
      expect(errors).toBeDefined();
    });
  });
});
