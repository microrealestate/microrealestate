const request = require('supertest');
const server = require('../server');
const realmManager = require('../managers/realmmanager');
const leaseManager = require('../managers/leasemanager');
const tenantManager = require('../managers/occupantmanager');
const documentManager = require('../managers/documentmanager');
const templateManager = require('../managers/templatemanager');
const rentManager = require('../managers/rentmanager');
const propertyManager = require('../managers/propertymanager');
const accountingManager = require('../managers/accountingmanager');
const ownerManager = require('../managers/ownermanager');
const emailManager = require('../managers/emailmanager');

jest.mock('../models/realm');
jest.mock('../managers/realmmanager');
jest.mock('../managers/leasemanager');
jest.mock('../managers/occupantmanager');
jest.mock('../managers/documentmanager');
jest.mock('../managers/templatemanager');
jest.mock('../managers/rentmanager');
jest.mock('../managers/propertymanager');
jest.mock('../managers/accountingmanager');
jest.mock('../managers/ownermanager');
jest.mock('../managers/emailmanager');

describe('API access', () => {
  it('should return 403 status when not authenticated', async () => {
    const response = await request(server).get('/api/v2/');
    expect(response.status).toEqual(403);
  });

  it('should return 403 if access token is undefined', async () => {
    const response = await request(server)
      .get('/api/v2/')
      .set('Authorization', 'Bearer');

    expect(response.status).toEqual(403);
  });

  it('should return 403 if access token is invalid', async () => {
    const response = await request(server)
      .get('/api/v2/')
      .set('Authorization', 'Bearer invalid');

    expect(response.status).toEqual(403);
  });

  it('should accept request when a valid access token is provided', async () => {
    const response = await request(server)
      .get('/api/v2/')
      .set('Authorization', 'Bearer myToken');

    expect(response.status).toEqual(404);
  });
});

describe('/api/v2/realms', () => {
  it('GET /api/v2/realms', async () => {
    const response = await request(server)
      .get('/api/v2/realms')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(realmManager.all).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('GET /api/v2/realms/{id}', async () => {
    const response = await request(server)
      .get('/api/v2/realms/myRealmId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(realmManager.one).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('POST /api/v2/realms', async () => {
    const response = await request(server)
      .post('/api/v2/realms')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(realmManager.add).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('PATCH /api/v2/realms/{id}', async () => {
    const response = await request(server)
      .patch('/api/v2/realms/myRealmId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(realmManager.update).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('should return 404 on DELETE /api/v2/realms/{id}', async () => {
    const response = await request(server)
      .del('/api/v2/realms/myRealmId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(response.status).toEqual(404);
  });
});

describe('/api/v2/leases', () => {
  it('GET /api/v2/leases', async () => {
    const response = await request(server)
      .get('/api/v2/leases')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(leaseManager.all).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('GET /api/v2/leases/{id}', async () => {
    const response = await request(server)
      .get('/api/v2/leases/leaseId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(leaseManager.one).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('POST /api/v2/leases', async () => {
    const response = await request(server)
      .post('/api/v2/leases')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(leaseManager.add).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('PATCH /api/v2/leases/{id}', async () => {
    const response = await request(server)
      .patch('/api/v2/leases/leaseId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(leaseManager.update).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('DELETE /api/v2/leases/{id}', async () => {
    const response = await request(server)
      .del('/api/v2/leases/leaseId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(leaseManager.remove).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
});

describe('/api/v2/documents', () => {
  it('GET /api/v2/documents/document/{id}/{term}', async () => {
    const response = await request(server)
      .get('/api/v2/documents/document/id/term')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(documentManager.get).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('PATCH /api/v2/documents/{id}', async () => {
    const response = await request(server)
      .patch('/api/v2/documents/id')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(documentManager.update).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
});

describe('/api/v2/tenants', () => {
  it('GET /api/v2/tenants', async () => {
    const response = await request(server)
      .get('/api/v2/tenants')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(tenantManager.all).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('GET /api/v2/tenants/{id}', async () => {
    const response = await request(server)
      .get('/api/v2/tenants/tenantId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(tenantManager.one).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('POST /api/v2/tenants', async () => {
    const response = await request(server)
      .post('/api/v2/tenants')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(tenantManager.add).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('PATCH /api/v2/tenants/{id}', async () => {
    const response = await request(server)
      .patch('/api/v2/tenants/tenantId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(tenantManager.update).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('DELETE /api/v2/tenants/{id}', async () => {
    const response = await request(server)
      .del('/api/v2/tenants/tenantId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(tenantManager.remove).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
});

describe('/api/v2/documents', () => {});

describe('/api/v2/templates', () => {
  it('GET /api/v2/templates', async () => {
    const response = await request(server)
      .get('/api/v2/templates')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(templateManager.all).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('GET /api/v2/templates/{id}', async () => {
    const response = await request(server)
      .get('/api/v2/templates/templateId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(templateManager.one).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('POST /api/v2/templates', async () => {
    const response = await request(server)
      .post('/api/v2/templates')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(templateManager.add).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('PUT /api/v2/templates/{id}', async () => {
    const response = await request(server)
      .put('/api/v2/templates')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(templateManager.update).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('DELETE /api/v2/templates/{id}', async () => {
    const response = await request(server)
      .del('/api/v2/templates/templateId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(templateManager.remove).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
});

describe('/api/v2/rents', () => {
  it('GET /api/v2/rents/{year}/{month}', async () => {
    const response = await request(server)
      .get('/api/v2/rents/2021/07')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(rentManager.all).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('GET /api/v2/rents/{id}/{term}', async () => {
    const response = await request(server)
      .get('/api/v2/rents/tenant/id/term')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(rentManager.rentOfOccupantByTerm).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('GET /api/v2/rents/{id}', async () => {
    const response = await request(server)
      .get('/api/v2/rents/tenant/id')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(rentManager.rentsOfOccupant).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('PATCH /api/v2/rents/payment/{id}/{term}', async () => {
    const response = await request(server)
      .patch('/api/v2/rents/payment/id/term')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(rentManager.updateByTerm).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
});

describe('/api/v2/properties', () => {
  it('GET /api/v2/properties', async () => {
    const response = await request(server)
      .get('/api/v2/properties')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(propertyManager.all).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('GET /api/v2/properties/{id}', async () => {
    const response = await request(server)
      .get('/api/v2/properties/propertyId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(propertyManager.one).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('POST /api/v2/properties', async () => {
    const response = await request(server)
      .post('/api/v2/properties')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(propertyManager.add).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('PATCH /api/v2/properties/{id}', async () => {
    const response = await request(server)
      .patch('/api/v2/properties/propertyId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(propertyManager.update).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });

  it('DELETE /api/v2/properties/{id}', async () => {
    const response = await request(server)
      .del('/api/v2/properties/propertyId')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(propertyManager.remove).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
});

describe('/api/v2/accounting', () => {
  it('GET /api/v2/accounting/{year}', async () => {
    const response = await request(server)
      .get('/api/v2/accounting/2021')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(accountingManager.all).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
});

describe('/api/v2/owner', () => {
  it('GET /api/v2/owner', async () => {
    const response = await request(server)
      .get('/api/v2/owner')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(ownerManager.all).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
  it('PATCH /api/v2/owner/{id}', async () => {
    const response = await request(server)
      .patch('/api/v2/owner/id')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(ownerManager.update).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
});

describe('/api/v2/emails', () => {
  it('POST /api/v2/emails', async () => {
    const response = await request(server)
      .post('/api/v2/emails')
      .set('Authorization', 'Bearer myToken')
      .set('organizationId', 'myOrgId');

    expect(emailManager.send).toHaveBeenCalled();
    expect(response.status).toEqual(200);
  });
});
