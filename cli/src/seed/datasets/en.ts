import type { DemoDataset } from './types.js';

const dataset: DemoDataset = {
  locale: 'en',
  currency: 'USD',
  credentials: {
    firstname: 'Owen',
    lastname: 'Whitfield',
    email: 'demo@example.com',
    password: 'Demo1234'
  },
  organization: {
    name: 'Whitfield Rentals',
    address: {
      street1: '12 Lilac Street',
      zipCode: '11211',
      city: 'Brooklyn',
      state: 'New York',
      country: 'United States'
    },
    phone: '2125550143',
    bankName: 'Demonstration Bank',
    iban: '021000021 / 1234567890'
  },
  contract: { name: 'LSE-12', description: 'Standard residential lease' },
  expenseTitle: 'common charges',
  paymentReferencePrefix: 'ACH',
  paymentMethod: 'transfer',
  properties: [
    {
      name: 'Williamsburg Apartment',
      type: 'apartment',
      description: 'Two bedroom apartment on the third floor with a balcony',
      surface: 730,
      price: 3200,
      phone: '2125550143',
      digicode: '12A34',
      address: {
        street1: '18 Bedford Avenue',
        zipCode: '11249',
        city: 'Brooklyn',
        state: 'New York',
        country: 'United States'
      }
    },
    {
      name: 'Flatiron Office',
      type: 'office',
      description: 'Ground floor open plan office of 1,290 sq ft',
      surface: 1290,
      price: 5500,
      phone: '2125550144',
      address: {
        street1: '5 West 22nd Street',
        zipCode: '10010',
        city: 'New York',
        state: 'New York',
        country: 'United States'
      }
    },
    {
      name: 'Wicker Park Storefront',
      type: 'store',
      description: 'Retail unit of 485 sq ft with a street facing window',
      surface: 485,
      price: 2400,
      address: {
        street1: '22 North Damen Avenue',
        zipCode: '60622',
        city: 'Chicago',
        state: 'Illinois',
        country: 'United States'
      }
    },
    {
      name: 'Williamsburg Parking',
      type: 'parking',
      description: 'Underground parking space, level P1',
      surface: 130,
      price: 250,
      address: {
        street1: '18 Bedford Avenue',
        zipCode: '11249',
        city: 'Brooklyn',
        state: 'New York',
        country: 'United States'
      }
    },
    {
      name: 'Wicker Park Garage',
      type: 'garage',
      description: 'Lock up garage of 160 sq ft',
      surface: 160,
      price: 180,
      address: {
        street1: '24 North Damen Avenue',
        zipCode: '60622',
        city: 'Chicago',
        state: 'Illinois',
        country: 'United States'
      }
    }
  ],
  tenants: [
    {
      name: 'Harper Studio',
      isCompany: true,
      company: 'Harper Studio LLC',
      manager: 'Sophie Harper',
      legalForm: 'LLC',
      siret: '87-1234567',
      capital: 15000,
      street1: '5 West 22nd Street',
      zipCode: '10010',
      city: 'New York',
      state: 'New York',
      country: 'United States',
      contacts: [
        {
          name: 'Sophie Harper',
          email: 'sophie.harper@example.com',
          phone1: '2125550111'
        }
      ],
      isVat: true,
      // New York City combined sales tax
      vatRatio: 0.08875,
      expectedSecurityDeposit: 11000,
      beginMonthsAgo: 14,
      endMonthsAhead: 22,
      properties: [{ name: 'Flatiron Office', expense: 420 }],
      depositPaid: true,
      settlement: 'up-to-date'
    },
    {
      name: 'Emily Carter',
      isCompany: false,
      street1: '18 Bedford Avenue',
      zipCode: '11249',
      city: 'Brooklyn',
      state: 'New York',
      country: 'United States',
      contacts: [
        {
          name: 'Emily Carter',
          email: 'emily.carter@example.com',
          phone1: '2125550222'
        }
      ],
      isVat: false,
      vatRatio: 0,
      expectedSecurityDeposit: 3200,
      beginMonthsAgo: 14,
      endMonthsAhead: 10,
      properties: [
        { name: 'Williamsburg Apartment', expense: 240 },
        { name: 'Williamsburg Parking', expense: 0 }
      ],
      depositPaid: true,
      settlement: 'partial-current'
    },
    {
      name: 'Daniel Okafor',
      isCompany: false,
      street1: '22 North Damen Avenue',
      zipCode: '60622',
      city: 'Chicago',
      state: 'Illinois',
      country: 'United States',
      contacts: [
        {
          name: 'Daniel Okafor',
          email: 'daniel.okafor@example.com',
          phone1: '3125550333'
        }
      ],
      isVat: false,
      vatRatio: 0,
      expectedSecurityDeposit: 2400,
      beginMonthsAgo: 9,
      endMonthsAhead: 27,
      properties: [{ name: 'Wicker Park Storefront', expense: 150 }],
      depositPaid: false,
      settlement: 'late-one'
    },
    {
      name: 'Priya Raman',
      isCompany: false,
      street1: '24 North Damen Avenue',
      zipCode: '60622',
      city: 'Chicago',
      state: 'Illinois',
      country: 'United States',
      contacts: [
        {
          name: 'Priya Raman',
          email: 'priya.raman@example.com',
          phone1: '3125550444'
        }
      ],
      isVat: false,
      vatRatio: 0,
      expectedSecurityDeposit: 180,
      beginMonthsAgo: 5,
      endMonthsAhead: 31,
      properties: [{ name: 'Wicker Park Garage', expense: 0 }],
      depositPaid: false,
      settlement: 'late-two'
    }
  ],
  leaseTemplate: {
    name: 'Lease agreement',
    title: ['LEASE AGREEMENT'],
    intro: [
      [
        'Between ',
        { field: '{{landlord.name}}', label: 'Landlord name' },
        ', of ',
        { field: '{{landlord.address.street1}}', label: 'Landlord address' },
        ', ',
        { field: '{{landlord.address.city}}', label: 'City' },
        ', ',
        { field: '{{landlord.address.state}}', label: 'State' },
        ' ',
        { field: '{{landlord.address.zipCode}}', label: 'ZIP code' },
        ', hereafter called the landlord,'
      ],
      [
        'and ',
        { field: '{{tenant.name}}', label: 'Tenant name' },
        ', represented by ',
        { field: '{{tenant.contacts.[0].name}}', label: 'Tenant contact' },
        ', hereafter called the tenant,'
      ],
      ['the following has been agreed.']
    ],
    clauses: [
      {
        heading: 'Premises',
        lines: [
          [
            'The landlord leases to the tenant the following property: ',
            { field: '{{properties.list.[0].name}}', label: 'Property' },
            ', ',
            {
              field: '{{properties.list.[0].address.street1}}',
              label: 'Property address'
            },
            ', ',
            {
              field: '{{properties.list.[0].address.city}}',
              label: 'Property city'
            },
            ', ',
            {
              field: '{{properties.list.[0].address.state}}',
              label: 'Property state'
            },
            ' ',
            {
              field: '{{properties.list.[0].address.zipCode}}',
              label: 'Property ZIP code'
            },
            ', with a total floor area of ',
            { field: '{{properties.total.surface}}', label: 'Total area' },
            ' sq ft.'
          ]
        ]
      },
      {
        heading: 'Term',
        lines: [
          [
            'This lease runs from ',
            { field: '{{lease.beginDate}}', label: 'Start date' },
            ' until ',
            { field: '{{lease.endDate}}', label: 'End date' },
            '.'
          ]
        ]
      },
      {
        heading: 'Rent and charges',
        lines: [
          [
            'The monthly rent is ',
            { field: '{{properties.total.rentAmount}}', label: 'Rent' },
            ', plus charges of ',
            { field: '{{properties.total.expensesAmount}}', label: 'Charges' },
            ', giving a total of ',
            {
              field: '{{properties.total.allInclusiveRentAmount}}',
              label: 'Rent including charges'
            },
            '.'
          ],
          [
            'Rent is payable in advance on the first day of each month by bank transfer.'
          ]
        ]
      },
      {
        heading: 'Security deposit',
        lines: [
          [
            'A security deposit of ',
            { field: '{{lease.deposit}}', label: 'Security deposit' },
            ' is paid by the tenant on signature. It is returned within 30 days of the keys being handed back, less any sums owed.'
          ]
        ]
      },
      {
        heading: 'Permitted use',
        lines: [
          [
            'The premises are leased for the following use: ',
            {
              field: '{{properties.list.[0].description}}',
              label: 'Property description'
            },
            '. Any other use requires the written consent of the landlord.'
          ]
        ]
      },
      {
        heading: 'Maintenance and repairs',
        lines: [
          [
            'The tenant keeps the premises in good order and pays for tenant repairs. Structural repairs remain the responsibility of the landlord.'
          ]
        ]
      },
      {
        heading: 'Insurance',
        lines: [
          [
            'The tenant provides proof of renters insurance each year. The certificate is given to the landlord on each renewal.'
          ]
        ]
      },
      {
        heading: 'Termination',
        lines: [
          [
            'The tenant may end this lease at any time by giving 90 days notice in writing by certified mail.'
          ]
        ]
      }
    ],
    closing: [
      [
        'Signed at ',
        { field: '{{current.location}}', label: 'Place' },
        ' on ',
        { field: '{{current.date}}', label: 'Date' },
        ', in two original copies.'
      ],
      ['The landlord                                       The tenant']
    ]
  },
  fileDescriptors: [
    {
      name: 'Photo identification',
      description: 'Valid photo identification of the tenant',
      hasExpiryDate: true,
      required: true,
      requiredOnceContractTerminated: false
    },
    {
      name: 'Renters insurance certificate',
      description: 'Renters insurance certificate for the current year',
      hasExpiryDate: true,
      required: true,
      requiredOnceContractTerminated: false
    },
    {
      name: 'Move out inspection',
      description: 'Inspection report taken when the keys are handed back',
      hasExpiryDate: false,
      required: false,
      requiredOnceContractTerminated: true
    }
  ]
};

export default dataset;
