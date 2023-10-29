import type { Contract, Invoice } from '@/types';

const contract: Contract = {
  name: 'Bail commercial 369',
  tenantName: 'Music and Co',
  startDate: '2021-01-01',
  endDate: '2021-12-31',
  terminationDate: '2021-12-31',
  status: 'active',
  properties: [
    {
      id: '1',
      name: 'Office 1',
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA',
    },
    {
      id: '2',
      name: 'Office 2',
      address: '456 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA',
    },
    {
      id: '3',
      name: 'Car Park',
      address: '789 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA',
    },
  ],
  balance: 4000,
  deposit: 900,
  // loop to build an array of 12 invoices
  invoices: Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const term = `2021${month.toString().padStart(2, '0')}0100`;
    const methods = ['bank-transfer', 'credit-card', 'cash', 'check'];
    return {
      id: `${i + 1}`,
      term,
      amount: 1000,
      status: 'paid',
      method: methods[i % methods.length],
    } as Invoice;
  }),
  // loop to build an array of 12 scanned documents
  documents: Array.from({ length: 5 }, (_, i) => {
    // build a random document name and description
    const name = `document-${i + 1}.pdf`;
    const description = `Document ${i + 1}`;
    return {
      id: `${i + 1}`,
      name,
      description,
    };
  }),
};

export const request = {
  async get<T>(url: string) {
    if (url === '/api/contract') {
      return contract as T;
    }
  },
};
