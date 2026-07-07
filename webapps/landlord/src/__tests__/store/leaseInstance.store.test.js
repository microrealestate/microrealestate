/* eslint-env node, jest */

import { apiFetcher } from '../../utils/fetch';
import LeaseInstance from '../../store/LeaseInstance';

jest.mock('../../utils/fetch', () => ({
  apiFetcher: jest.fn()
}));

describe('LeaseInstance store', () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiFetcher.mockReturnValue(mockApi);
  });

  it('fetches lease instances by tenant', async () => {
    const store = new LeaseInstance();
    mockApi.get.mockResolvedValueOnce({
      data: [{ _id: 'li-1', status: 'draft', tenantIds: ['tenant-1'] }]
    });

    const response = await store.fetchByTenant('tenant-1');

    expect(response.status).toBe(200);
    expect(store.items).toHaveLength(1);
    expect(store.items[0]._id).toBe('li-1');
    expect(mockApi.get).toHaveBeenCalledWith('/lease-instances/by-tenant/tenant-1');
  });

  it('activates a draft lease instance', async () => {
    const store = new LeaseInstance();
    store.items = [{ _id: 'li-1', status: 'draft' }];

    mockApi.post.mockResolvedValueOnce({
      data: { _id: 'li-1', status: 'active' }
    });

    const response = await store.activate('li-1');

    expect(response.status).toBe(200);
    expect(store.items[0].status).toBe('active');
    expect(mockApi.post).toHaveBeenCalledWith('/lease-instances/li-1/activate', {});
  });
});
