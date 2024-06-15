import {
  PaymentMethod,
  PaymentStatus,
  TenantAPI
} from '@microrealestate/types';
import moment from 'moment';

export const getAllTenants: {
  error?: string;
  results: TenantAPI.TenantDataType[];
} = {
  results: [
    {
      tenant: {
        id: 'mco',
        name: 'Music and Co',
        contacts: [
          {
            name: 'John Doe',
            email: 'john.doe@mco.com',
            phone1: '0123456789'
          }
        ],
        addresses: [
          {
            street1: '1 rue de la Paix',
            zipCode: '75000',
            city: 'Paris',
            country: 'France'
          }
        ]
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
            country: 'France'
          }
        ],
        contacts: [
          {
            name: 'Mike Smith',
            email: 'msmith@rec.com',
            phone1: '0123456789',
            phone2: '0987654321'
          }
        ]
      },
      lease: {
        name: 'Bail commercial 369',
        beginDate: new Date('2021-01-01'),
        endDate: new Date('2030-12-31'),
        timeRange: 'months',
        status: 'active',
        rent: {
          totalPreTaxAmount: 1000,
          totalChargesAmount: 0,
          totalVatAmount: 0,
          totalAmount: 1000
        },
        remainingIterations: 120,
        remainingIterationsToPay: 120,
        properties: [
          {
            id: '1',
            name: 'Office 1',
            description: 'Work from home office',
            type: 'office'
          },
          {
            id: '3',
            name: 'Car Park',
            description: 'Parking space',
            type: 'parking'
          }
        ],
        // loop to build an array of 120 invoices
        invoices: Array.from({ length: 120 }, (_, i) => {
          const momentTerm = moment('2021-01-01').add(i, 'month');
          const isAfterNow = momentTerm.isSameOrAfter(moment(), 'month');
          const countAfterNow = momentTerm.diff(moment(), 'month');
          const term = Number(momentTerm.format('YYYYMMDDHH'));
          const methods = ['transfer', 'credit-card', 'cash', 'check'];
          return {
            id: String(term),
            term,
            balance: isAfterNow ? 1000 * countAfterNow : 1000,
            payment: isAfterNow ? 0 : 1000,
            grandTotal: 1000,
            payments: momentTerm.isSameOrAfter(moment())
              ? []
              : Array.from({ length: 3 }, (_, j) => {
                  const date = momentTerm.add(j, 'day').format('DD/MM/YYYY');
                  return {
                    date,
                    method: methods[j % methods.length],
                    reference: `${i + 1}-${j + 1}`,
                    amount: 1000
                  };
                }),
            status: (isAfterNow ? 'unpaid' : 'paid') as PaymentStatus,
            methods: isAfterNow
              ? []
              : (['transfer', 'credit-card', 'cash'] as PaymentMethod[])
          };
        }).sort((a, b) => b.term - a.term),
        // loop to build an array of 12 scanned documents
        documents: Array.from({ length: 5 }, (_, i) => {
          // build a random document name and description
          const name = `document-${i + 1}.pdf`;
          const description = `Document ${i + 1}`;
          return {
            url: `${i + 1}`,
            name,
            description
          };
        }),
        balance: 1000,
        deposit: 900
      }
    }
  ]
};

export const getOneTenant: {
  error?: string;
  results: TenantAPI.TenantDataType[];
} = {
  results: [getAllTenants.results[0]]
};
