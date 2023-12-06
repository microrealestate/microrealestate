import { TenantAPI } from '@microrealestate/types';

const tenant: TenantAPI.GetTenants.Response = {
  results: [
    {
      tenant: {
        id: 'mco',
        name: 'Music and Co',
        contacts: [
          {
            name: 'John Doe',
            email: 'john.doe@mco.com',
            phone1: '0123456789',
          },
        ],
        addresses: [
          {
            street1: '1 rue de la Paix',
            zipCode: '75000',
            city: 'Paris',
            country: 'France',
          },
        ],
      },
      landlord: {
        name: 'Real Estate Company',
        currency: 'EUR',
        locale: 'fr',
        addresses: [
          {
            street1: '1 rue de la Paix',
            zipCode: '75000',
            city: 'Paris',
            country: 'France',
          },
        ],
        contacts: [
          {
            name: 'Mike Smith',
            email: 'msmith@rec.com',
            phone1: '0123456789',
            phone2: '0987654321',
          },
        ],
      },
      lease: {
        name: 'Bail commercial 369',
        beginDate: new Date('2021-01-01'),
        endDate: new Date('2021-12-31'),
        terminationDate: new Date('2021-12-31'),
        timeRange: 'months',
        status: 'active',
        properties: [
          {
            id: '1',
            name: 'Office 1',
            description: 'Work from home office',
            type: 'office',
          },
          {
            id: '2',
            name: 'Apartment',
            description: 'Home sweet home',
            type: 'apartment',
          },
          {
            id: '3',
            name: 'Car Park',
            description: 'Parking space',
            type: 'parking',
          },
        ],
        // loop to build an array of 12 invoices
        invoices: Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const term = Number(`2021${month.toString().padStart(2, '0')}0100`);
          const methods = ['transfer', 'credit-card', 'cash', 'check'];
          return {
            id: `${i + 1}`,
            term,
            balance: 4000,
            payment: 1000,
            grandTotal: 4000,
            payments: Array.from({ length: 3 }, (_, j) => {
              const date = new Date(`2021-${month}-${j + 1}`);
              return {
                date,
                method: methods[j % methods.length],
                reference: `${i + 1}-${j + 1}`,
                amount: 1000,
              };
            }),
            status: 'paid',
            methods: ['transfer'],
          };
        }),
        // loop to build an array of 12 scanned documents
        documents: Array.from({ length: 5 }, (_, i) => {
          // build a random document name and description
          const name = `document-${i + 1}.pdf`;
          const description = `Document ${i + 1}`;
          return {
            url: `${i + 1}`,
            name,
            description,
          };
        }),
        balance: 4000,
        deposit: 900,
      },
    },
  ],
};

export const request = {
  async get<T>(url: string) {
    if (url === '/api/contract') {
      return tenant as T;
    }
  },
};
