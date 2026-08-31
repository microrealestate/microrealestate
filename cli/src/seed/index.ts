import type { API, TemplateType } from '@microrealestate/shared';
import chalk from 'chalk';
import moment from 'moment';
import { SeedClient } from './client.js';
import { DEMO_DATASET } from './datasets/index.js';
import type {
  DemoDataset,
  DemoTenant,
  SettlementProfile
} from './datasets/types.js';
import { renderLeaseTemplate } from './richtext.js';

export type SeedOptions = {
  url: string;
  keep: boolean;
};

const DEV_SMTP = {
  server: 'smtp4dev',
  port: 25,
  encryption: 'none',
  authentication: false,
  username: '',
  password: '',
  passwordUpdated: true
};

function currentTerm() {
  return Number(moment().format('YYYYMMDDHH'));
}

function leaseBeginDate(monthsAgo: number) {
  return moment().subtract(monthsAgo, 'months').startOf('month').toDate();
}

function leaseEndDate(monthsAhead: number) {
  return moment().add(monthsAhead, 'months').endOf('month').toDate();
}

async function createOrganization(client: SeedClient, dataset: DemoDataset) {
  const existing = await client.api<API.Landlord.Realm.GetRealm.ResponseBody>(
    'get',
    '/realms'
  );
  if (existing) {
    console.log(chalk.dim(`organization ${existing.name} already exists`));
    return existing._id;
  }

  const { organization, credentials } = dataset;
  const landlordName = `${credentials.firstname} ${credentials.lastname}`;
  const realm = await client.api<API.Landlord.Realm.PostAddRealm.ResponseBody>(
    'post',
    '/realms',
    {
      name: organization.name,
      locale: dataset.locale,
      currency: dataset.currency,
      isCompany: false,
      member1: { name: landlordName, email: credentials.email },
      addresses: [organization.address],
      contacts: [
        {
          name: landlordName,
          email: credentials.email,
          phone1: organization.phone
        }
      ],
      bankInfo: { name: organization.bankName, iban: organization.iban }
    }
  );
  console.log(
    `${chalk.green('organization')} ${realm.name} (${dataset.locale}, ${dataset.currency})`
  );
  return realm._id;
}

async function configureDevThirdParties(
  client: SeedClient,
  realmId: string,
  dataset: DemoDataset
) {
  const email = dataset.credentials.email;

  await client.api('patch', `/realms/${realmId}`, {
    _id: realmId,
    thirdParties: {
      smtp: {
        server: DEV_SMTP.server,
        port: DEV_SMTP.port,
        encryption: DEV_SMTP.encryption,
        authentication: DEV_SMTP.authentication,
        username: DEV_SMTP.username,
        password: DEV_SMTP.password,
        passwordUpdated: DEV_SMTP.passwordUpdated,
        fromEmail: email,
        replyToEmail: email
      }
    }
  });
  console.log(
    `${chalk.green('email service')} smtp4dev:25 (no encryption, no authentication)`
  );

  await client.api('post', `/realms/${realmId}/test-smtp`, {});
  console.log(`${chalk.green('test')} smtp connection ok`);
}

async function createContract(client: SeedClient, dataset: DemoDataset) {
  const lease = await client.api<API.Landlord.Lease.PostAddLease.ResponseBody>(
    'post',
    '/leases',
    {
      name: dataset.contract.name,
      description: dataset.contract.description,
      timeRange: 'months',
      numberOfTerms: 108,
      // the api only stores active: true when numberOfTerms and timeRange are
      // sent in the same request (services/api/src/managers/leasemanager.ts)
      active: true
    }
  );
  console.log(`${chalk.green('contract')} ${lease.name} (108 months)`);
  return lease;
}

async function createTemplates(
  client: SeedClient,
  dataset: DemoDataset,
  leaseId: string
) {
  const { contents, html } = renderLeaseTemplate(dataset.leaseTemplate);
  const leaseTemplate = await client.api<TemplateType>('post', '/templates', {
    name: dataset.leaseTemplate.name,
    type: 'text',
    description: dataset.contract.description,
    contents,
    html,
    relatesTo: [leaseId],
    required: false,
    requiredOnceContractTerminated: false
  });
  console.log(
    `${chalk.green('template')} ${leaseTemplate.name} (text, ${dataset.leaseTemplate.clauses.length} clauses)`
  );

  for (const descriptor of dataset.fileDescriptors) {
    const created = await client.api<TemplateType>('post', '/templates', {
      ...descriptor,
      type: 'fileDescriptor',
      relatesTo: [leaseId]
    });
    console.log(
      `${chalk.green('template')} ${created.name} (fileDescriptor, ${descriptor.required ? 'required' : 'optional'})`
    );
  }

  return leaseTemplate;
}

async function createProperties(client: SeedClient, dataset: DemoDataset) {
  const propertyIdsByName = new Map<string, string>();

  for (const property of dataset.properties) {
    const created =
      await client.api<API.Landlord.Property.PostAddProperty.ResponseBody>(
        'post',
        '/properties',
        property
      );
    propertyIdsByName.set(property.name, created._id);
    console.log(
      `${chalk.green('property')} ${property.name} (${property.type}, ${property.price})`
    );
  }

  return propertyIdsByName;
}

async function createTenants(
  client: SeedClient,
  dataset: DemoDataset,
  leaseId: string,
  propertyIdsByName: Map<string, string>
) {
  const tenants: API.Landlord.Tenant.OccupantData[] = [];

  for (const demoTenant of dataset.tenants) {
    const beginDate = leaseBeginDate(demoTenant.beginMonthsAgo);
    const endDate = leaseEndDate(demoTenant.endMonthsAhead);

    // Rents are only generated when every property carries a rent, an entryDate
    // and an exitDate, see propertiesHaveRentData in occupantmanager.
    const properties = demoTenant.properties.map(({ name, expense }) => {
      const propertyId = propertyIdsByName.get(name);
      if (!propertyId) {
        throw new Error(`unknown property ${name}`);
      }
      const price =
        dataset.properties.find((property) => property.name === name)?.price ??
        0;
      return {
        propertyId,
        rent: price,
        entryDate: beginDate,
        exitDate: endDate,
        expenses: expense
          ? [
              {
                title: dataset.expenseTitle,
                amount: expense,
                beginDate,
                endDate
              }
            ]
          : []
      };
    });

    const {
      beginMonthsAgo: _beginMonthsAgo,
      endMonthsAhead: _endMonthsAhead,
      properties: _properties,
      settlement: _settlement,
      depositPaid: _depositPaid,
      ...tenantFields
    } = demoTenant;

    const securityDeposit = demoTenant.depositPaid
      ? [
          {
            amount: demoTenant.expectedSecurityDeposit,
            date: beginDate,
            paymentType: dataset.paymentMethod,
            reference: `${dataset.paymentReferencePrefix}-DEPOSIT`
          }
        ]
      : [];

    const created =
      await client.api<API.Landlord.Tenant.PostAddOccupant.ResponseBody>(
        'post',
        '/tenants',
        {
          ...tenantFields,
          leaseId,
          frequency: 'months',
          beginDate,
          endDate,
          properties,
          securityDeposit
        }
      );

    if (!created) {
      throw new Error(`tenant ${demoTenant.name} was not created`);
    }

    tenants.push(created);
    console.log(
      `${chalk.green('tenant')} ${created.name} (lease from ${moment(beginDate).format('MM/YYYY')} to ${moment(endDate).format('MM/YYYY')}, deposit ${demoTenant.depositPaid ? 'settled' : 'outstanding'})`
    );
  }

  return tenants;
}

async function createLeaseDocument(
  client: SeedClient,
  tenant: API.Landlord.Tenant.OccupantData,
  templateId: string,
  leaseId: string
) {
  const document = await client.api<{ _id: string; name: string }>(
    'post',
    '/documents',
    {
      templateId,
      tenantId: tenant._id,
      leaseId,
      type: 'text'
    }
  );
  console.log(`${chalk.green('document')} ${tenant.name}: ${document.name}`);
}

const SETTLEMENT_PROFILES: Record<
  SettlementProfile,
  { unpaid: number; partialLast: boolean }
> = {
  'up-to-date': { unpaid: 0, partialLast: false },
  'partial-current': { unpaid: 0, partialLast: true },
  'late-one': { unpaid: 1, partialLast: false },
  'late-two': { unpaid: 2, partialLast: true }
};

function round2(amount: number) {
  return Math.round(amount * 100) / 100;
}

// POST /tenants builds the rent schedule without the tenant vat rate: the api
// only applies it when a term is settled and the contract is recomputed. So the
// first settlement of a tenant reads a total that is short by the vat, and the
// payment has to be replayed against the recomputed total. payTerm replaces the
// payments of a term, so patching the same term again corrects it.
async function settleTerm(
  client: SeedClient,
  dataset: DemoDataset,
  tenant: API.Landlord.Tenant.OccupantData,
  term: number,
  rent: API.Landlord.Rent.GetTenantRentByTerm.ResponseBody,
  ratio: number
) {
  let target = round2(rent.totalToPay * ratio);

  for (let attempt = 0; attempt < 2; attempt++) {
    if (target <= 0) {
      return false;
    }

    const updated =
      await client.api<API.Landlord.Rent.PatchPaymentByTerm.ResponseBody>(
        'patch',
        `/rents/payment/${tenant._id}/${term}`,
        {
          _id: tenant._id,
          payments: [
            {
              amount: target,
              date: moment(String(term), 'YYYYMMDDHH').date(5).toDate(),
              type: dataset.paymentMethod,
              reference: `${dataset.paymentReferencePrefix}-${term}`
            }
          ]
        }
      );

    const expected = round2(updated.totalToPay * ratio);
    if (Math.abs(expected - target) <= 0.005) {
      return true;
    }
    target = expected;
  }

  throw new Error(
    `term ${term} of tenant ${tenant.name} could not be settled: the total kept changing`
  );
}

// Settles oldest first: an unsettled term carries its balance to the next one.
async function recordPayments(
  client: SeedClient,
  dataset: DemoDataset,
  tenant: API.Landlord.Tenant.OccupantData,
  settlement: SettlementProfile
) {
  const term = currentTerm();
  // the tenant returned by POST /tenants carries no rents: toOccupantData strips
  // them, the rent schedule is only readable through this endpoint
  const { rents } =
    await client.api<API.Landlord.Rent.GetTenantRents.ResponseBody>(
      'get',
      `/rents/tenant/${tenant._id}`
    );

  if (!rents?.length) {
    throw new Error(
      `tenant ${tenant.name} has no rent term, the lease payload is incomplete`
    );
  }

  const dueTerms = rents
    .map((rent) => rent.term)
    .filter((rentTerm) => rentTerm <= term)
    .sort((a, b) => a - b);

  const profile = SETTLEMENT_PROFILES[settlement];
  const unpaidCount = Math.min(profile.unpaid, dueTerms.length);
  const termsToSettle = dueTerms.slice(0, dueTerms.length - unpaidCount);
  let paidCount = 0;
  let partiallyPaidCount = 0;

  for (const [index, termToSettle] of termsToSettle.entries()) {
    const isLast = profile.partialLast && index === termsToSettle.length - 1;
    // read the term back: settling a term changes the balance of the next one
    const rent =
      await client.api<API.Landlord.Rent.GetTenantRentByTerm.ResponseBody>(
        'get',
        `/rents/tenant/${tenant._id}/${termToSettle}`
      );

    const settled = await settleTerm(
      client,
      dataset,
      tenant,
      termToSettle,
      rent,
      isLast ? 0.5 : 1
    );
    if (!settled) {
      continue;
    }

    if (isLast) {
      partiallyPaidCount++;
    } else {
      paidCount++;
    }
  }

  console.log(
    `${chalk.green('payments')} ${tenant.name} (${settlement}): ${paidCount} paid, ${partiallyPaidCount} partially paid, ${unpaidCount} unpaid of ${dueTerms.length} due terms`
  );
}

function settlementOf(demoTenant: DemoTenant | undefined, name: string) {
  if (!demoTenant) {
    throw new Error(`no settlement profile for tenant ${name}`);
  }
  return demoTenant.settlement;
}

export async function seedDemo(options: SeedOptions) {
  await seed({ ...options, dev: false });
}

export async function seedDev(options: SeedOptions) {
  await seed({ ...options, dev: true });
}

async function seed({ url, keep, dev }: SeedOptions & { dev: boolean }) {
  const dataset = DEMO_DATASET;
  const client = new SeedClient(url);

  console.log(chalk.dim(`target ${url}`));
  console.log(
    chalk.dim(`locale ${dataset.locale} / currency ${dataset.currency}`)
  );

  if (keep) {
    console.log(chalk.dim('--keep: the database is left untouched'));
  } else {
    console.log(
      chalk.yellow(
        'Resetting the database: accounts, organizations, properties, tenants, leases, documents and every redis key are dropped.'
      )
    );
    await client.reset();
    console.log(`${chalk.green('reset')} database emptied`);
  }

  // signup stays open only while the database holds no account, so --keep may
  // still need it when it runs against an empty instance
  if (await client.isSignUpAvailable()) {
    await client.signUp(dataset.credentials);
    console.log(`${chalk.green('account')} ${dataset.credentials.email}`);
  }

  await client.signIn(dataset.credentials.email, dataset.credentials.password);

  const realmId = await createOrganization(client, dataset);
  if (dev) {
    await configureDevThirdParties(client, realmId, dataset);
  }
  const lease = await createContract(client, dataset);
  const leaseTemplate = await createTemplates(client, dataset, lease._id);
  const propertyIdsByName = await createProperties(client, dataset);
  const tenants = await createTenants(
    client,
    dataset,
    lease._id,
    propertyIdsByName
  );

  for (const [index, tenant] of tenants.entries()) {
    await createLeaseDocument(client, tenant, leaseTemplate._id, lease._id);
    await recordPayments(
      client,
      dataset,
      tenant,
      settlementOf(dataset.tenants[index], tenant.name)
    );
  }

  console.log('');
  console.log(chalk.bold('Demo data ready'));
  console.log(`  landlord app  ${url}/landlord`);
  console.log(`  email         ${dataset.credentials.email}`);
  console.log(`  password      ${dataset.credentials.password}`);
  if (dev) {
    console.log('');
    console.log(`  emails        http://localhost:5080 (no sign in needed)`);
  }
}
