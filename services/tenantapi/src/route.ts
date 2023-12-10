import * as Express from 'express';
import {
  CollectionTypes,
  MongooseDocument,
  ServiceRequest,
  TenantAPI,
  UserServicePrincipal,
} from '@microrealestate/types';
import { Collections } from '@microrealestate/typed-common';
import moment from 'moment';

const routes = Express.Router();
routes.get(
  '/tenants',
  async (
    req: Express.Request<TenantAPI.GetTenants.Request>,
    res: Express.Response<TenantAPI.GetTenants.Response>
  ) => {
    // tenant API can only be accessed with UserServicePrincipal
    if ((req as ServiceRequest).user.type !== 'user') {
      return res.sendStatus(403);
    }

    const email = ((req as ServiceRequest).user as UserServicePrincipal).email;
    if (!email) {
      return res.status(400).json({
        error: 'email is required',
      });
    }

    // find tenants from mongo which has a given email contact
    const dbTenants = await Collections.Tenant.find<
      MongooseDocument<CollectionTypes.Tenant>
    >({
      'contacts.email': { $regex: new RegExp(email, 'i') },
    }).populate<{
      realmId: CollectionTypes.Realm;
      leaseId: CollectionTypes.Lease;
    }>(['realmId', 'leaseId']);

    // the last term considering the current date
    const now = moment();
    const lastTerm = Number(now.format('YYYYMMDDHH'));

    res.json({
      results: dbTenants.map((tenant) => ({
        tenant: {
          id: tenant._id,
          name: tenant.name,
          contacts: tenant.contacts.map((contact) => ({
            name: contact.contact,
            email: contact.email,
            phone1: contact.phone,
          })),
          addresses: [
            {
              street1: tenant.street1,
              street2: tenant.street2,
              zipCode: tenant.zipCode,
              city: tenant.city,
              state: '',
              country: '',
            },
          ],
        },
        landlord: {
          name: tenant.realmId.name,
          addresses: tenant.realmId.addresses,
          contacts: tenant.realmId.contacts,
          currency: tenant.realmId.currency,
          locale: tenant.realmId.locale,
        },
        lease: {
          name: tenant.leaseId.name,
          beginDate: tenant.beginDate,
          endDate: tenant.endDate,
          terminationDate: tenant.terminationDate,
          timeRange: tenant.leaseId.timeRange,
          status: tenant.terminationDate
            ? 'terminated'
            : moment(tenant.endDate, 'YYYY-MM-DD').isBefore(now)
              ? 'ended'
              : 'active',
          properties:
            tenant.properties?.map((property) => ({
              id: property.property._id,
              name: property.property.name,
              description: property.property.description,
              type: property.property.type,
            })) || [],
          documents: [],
          // tenant.leaseId.documents.map((document) => ({
          //   name: document.name,
          //   description: document.description,
          //   url: document.url,
          // })),
          invoices: tenant.rents
            ?.filter(({ term }) => term <= lastTerm)
            .sort((r1, r2) => r2.term - r1.term)
            .map((rent) => ({
              term: rent.term,
              balance: rent.total.balance,
              grandTotal: rent.total.grandTotal,
              payment: rent.total.payment || 0,
              methods: rent.payments
                .filter((payment) => !!payment)
                .map((payment) => payment.type),
              status:
                rent.total.grandTotal - (rent.total.payment || 0) <= 0
                  ? 'paid'
                  : rent.total.payment > 0
                    ? 'partially-paid'
                    : 'unpaid',
              payments:
                rent.payments.map((payment) => ({
                  date: payment.date,
                  method: payment.type,
                  reference: payment.reference,
                  amount: payment.amount || 0,
                })) || [],
            })),
          balance: _computeBalance(tenant.rents, lastTerm),
          deposit: tenant.guaranty - tenant.guarantyPayback,
        },
      })),
    });
  }
);

export default routes;

function _computeBalance(rents: CollectionTypes.PartRent[], lastTerm: number) {
  // find the rent closest to the last term
  const rent = rents.reduce((prev, curr) => {
    if (curr.term <= lastTerm) {
      return curr;
    }

    return prev;
  });

  return -rent.total.grandTotal + rent.total.payment;
}
