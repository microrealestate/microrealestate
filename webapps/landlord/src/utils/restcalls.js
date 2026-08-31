import moment from 'moment';
import apiClient from '../utils/apiClient';

export const QueryKeys = {
  ORGANIZATION: 'organization',
  PROPERTIES: 'properties',
  PROPERTY_COUNT: 'propertyCount',

  TENANTS: 'tenants',
  TENANT_COUNT: 'tenantCount',

  RENTS: 'rents',
  RENT_COUNT: 'rentCount',
  TOP_UNPAID: 'topUnpaid',
  OCCUPANCY_RATE: 'occupanceRate',

  REVENUES_BREAKDOWN: 'breakdownRevenues',
  YEAR_REVENUES: 'yearRevenues',
  MONTH_REVENUES: 'monthRevenues',

  LEASES: 'leases',
  RENTAL_ACTIVITIES: 'rentalActivities',

  CONTRACTS_NEAR_RENEWAL: 'contractsNearRenewal',

  TODOS: 'todos'
};

export async function fetchTodos() {
  const response = await apiClient.get('/todos');
  return response.data;
}

export async function fetchOrganization(store) {
  const response = await store.organization.fetch();
  return response.data;
}

export async function createOrganization({ store, organization }) {
  const response = await store.organization.create(organization);
  if (response.status !== 200) {
    const error = new Error(
      response.message || 'failed to create the organization'
    );
    error.status = response.status;
    throw error;
  }
  return response.data;
}

export async function updateOrganization({ store, organization }) {
  const response = await store.organization.update(organization);
  if (response.status !== 200) {
    const error = new Error(
      response.message || 'failed to update the organization'
    );
    error.status = response.status;
    throw error;
  }
  return response.data;
}

export async function testSmtpConnection({ organizationId, smtp }) {
  const response = await apiClient.post(`/realms/${organizationId}/test-smtp`, {
    smtp
  });
  return response.data;
}

export async function provisionMember({ firstname, lastname, email }) {
  const response = await apiClient.post('/authenticator/landlord/members', {
    firstname,
    lastname,
    email
  });
  return response.data;
}

export async function deleteMemberAccount(email) {
  await apiClient.delete(
    `/authenticator/landlord/members/${encodeURIComponent(email)}`
  );
}

export async function fetchProperties(store) {
  const response = await store.property.fetch();
  return response.data;
}

export async function fetchTenants(store) {
  const response = await store.tenant.fetch();
  return response.data;
}

export async function fetchTenantCount(year) {
  const response = await apiClient.get(`/dashboard/tenants/count/${year}`);
  return response.data;
}

export async function fetchPropertyCount() {
  const response = await apiClient.get(`/dashboard/properties/count`);
  return response.data;
}

export async function fetchRentCount(month, year) {
  const response = await apiClient.get(
    `/dashboard/rents/count/${year}/${month}`
  );
  return response.data;
}

export async function fetchOccupancyRate(year) {
  const response = await apiClient.get(`/dashboard/occupancy/${year}`);
  return response.data;
}

export async function fetchRevenuesBreakdown(year) {
  const response = await apiClient.get(`/dashboard/revenues/breakdown/${year}`);
  return response.data;
}

export async function fetchYearRevenues(year) {
  const response = await apiClient.get(`/dashboard/revenues/${year}`);
  return response.data;
}

export async function fetchMonthRevenues(month, year) {
  const response = await apiClient.get(`/dashboard/revenues/${year}/${month}`);
  return response.data;
}

export async function fetchTopUnpaid(month, year) {
  const response = await apiClient.get(
    `/dashboard/rents/top-unpaid/${year}/${month}`
  );
  return response.data;
}

export async function fetchRents(store, yearMonth = null, updateStore = true) {
  let period;
  if (yearMonth) {
    period = moment(yearMonth, 'YYYY.MM', true);
  }

  if (!period?.isValid()) {
    period = moment();
  }

  if (updateStore) {
    store.rent.setPeriod(period);
  }

  const response = updateStore
    ? await store.rent.fetch()
    : await store.rent.fetchWithoutUpdatingStore(period);
  return response.data;
}

export async function fetchLeases(store) {
  const response = await store.lease.fetch();
  return response.data;
}

export async function updateLease({ store, lease }) {
  const response = await store.lease.update(lease);
  return response.data;
}

export async function fetchRentalActivities(store, year) {
  const response = await store.accounting.fetch(year);
  return response.data;
}

export async function fetchContractsNearRenewal(daysThreshold = 90) {
  const response = await apiClient.get(
    `/dashboard/contracts/near-renewal?days=${daysThreshold}`
  );
  return response.data;
}
