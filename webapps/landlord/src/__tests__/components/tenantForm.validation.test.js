/* eslint-env node, jest */

import { describe, expect, it } from '@jest/globals';
import { validate } from '../../components/tenants/forms/tenantFormSchema';

describe('TenantForm validation', () => {
  it('accepts empty invoiceEmail (optional)', async () => {
    const tenant = {
      name: 'John Tenant',
      isCompany: false,
      contacts: [{ contact: 'John', email: 'john@example.com', phone: '555-0100' }],
      street1: '123 Main St',
      city: 'Paris',
      zipCode: '75001',
      country: 'France',
      invoiceEmail: ''
    };

    await expect(validate(tenant)).resolves.toBeDefined();
  });

  it('accepts a valid invoiceEmail', async () => {
    const tenant = {
      name: 'John Tenant',
      isCompany: false,
      contacts: [{ contact: 'John', email: 'john@example.com', phone: '555-0100' }],
      street1: '123 Main St',
      city: 'Paris',
      zipCode: '75001',
      country: 'France',
      invoiceEmail: 'billing@example.com'
    };

    await expect(validate(tenant)).resolves.toBeDefined();
  });

  it('rejects invalid invoiceEmail format', async () => {
    const tenant = {
      name: 'John Tenant',
      isCompany: false,
      contacts: [{ contact: 'John', email: 'john@example.com', phone: '555-0100' }],
      street1: '123 Main St',
      city: 'Paris',
      zipCode: '75001',
      country: 'France',
      invoiceEmail: 'not-an-email'
    };

    await expect(validate(tenant)).rejects.toBeDefined();
  });
});
