import {
  Collections,
  DateFormat,
  type Middlewares,
  ServiceError
} from '@microrealestate/common';
import type { API, PropertyType, TenantType } from '@microrealestate/shared';
import moment from 'moment';
import * as FD from './frontdata';

function _lastBusyDay(tenant: Pick<TenantType, 'endDate' | 'terminationDate'>) {
  const date = tenant.terminationDate || tenant.endDate;
  return date ? moment(date, DateFormat.DATE_FORMAT) : undefined;
}

function _isOccupying(
  tenant: Pick<TenantType, 'beginDate' | 'endDate' | 'terminationDate'>,
  now: moment.Moment
) {
  const lastBusyDay = _lastBusyDay(tenant);
  if (!tenant.beginDate || !lastBusyDay) {
    return false;
  }
  return (
    moment(tenant.beginDate, DateFormat.DATE_FORMAT).isSameOrBefore(
      now,
      'day'
    ) && lastBusyDay.isSameOrAfter(now, 'day')
  );
}

async function _toPropertiesData(
  realm: NonNullable<Express.Request['realm']>,
  inputProperties: PropertyType[]
): Promise<API.Landlord.Property.PropertyWithOccupancyData[]> {
  const allTenants = await Collections.Tenant.find({
    realmId: realm._id,
    'properties.propertyId': {
      $in: inputProperties.map(({ _id }) => _id)
    }
  }).lean();

  const now = moment();
  return inputProperties.map((property) => {
    // most recent lease first, tenants without an end date last
    const tenants = allTenants
      .filter(({ properties }) =>
        properties
          .map(({ propertyId }) => propertyId)
          .includes(String(property._id))
      )
      .sort(
        (t1, t2) =>
          (_lastBusyDay(t2)?.valueOf() ?? 0) -
          (_lastBusyDay(t1)?.valueOf() ?? 0)
      );
    const occupant =
      tenants.find((tenant) => _isOccupying(tenant, now)) ?? tenants[0];
    return FD.toProperty(property, occupant, tenants);
  });
}

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export const add: Middlewares.AsyncRequestHandler<
  API.Landlord.Property.PostAddProperty.RequestParams,
  API.Landlord.Property.PostAddProperty.ResponseBody,
  API.Landlord.Property.PostAddProperty.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const property = new Collections.Property({
    ...req.body,
    realmId: realm._id
  });
  await property.save();
  const properties = await _toPropertiesData(realm, [property]);
  res.json(properties[0]);
};

export const update: Middlewares.AsyncRequestHandler<
  API.Landlord.Property.PutUpdateProperty.RequestParams,
  API.Landlord.Property.PutUpdateProperty.ResponseBody,
  API.Landlord.Property.PutUpdateProperty.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const property = req.body;

  const dbProperty = await Collections.Property.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: property._id
    },
    property,
    { new: true }
  ).lean();

  if (!dbProperty) throw new ServiceError('property not found', 404);

  const properties = await _toPropertiesData(realm, [dbProperty]);
  res.json(properties[0]);
};

export const remove: Middlewares.AsyncRequestHandler<
  API.Landlord.Property.DeleteRemoveProperty.RequestParams,
  API.Landlord.Property.DeleteRemoveProperty.ResponseBody,
  API.Landlord.Property.DeleteRemoveProperty.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const ids = req.params.ids.split(',');

  await Collections.Property.deleteMany({
    _id: { $in: ids },
    realmId: realm._id
  });

  res.sendStatus(200); // better to return 204
};

export const all: Middlewares.AsyncRequestHandler<
  API.Landlord.Property.GetAllProperties.RequestParams,
  API.Landlord.Property.GetAllProperties.ResponseBody,
  API.Landlord.Property.GetAllProperties.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const dbProperties = await Collections.Property.find({
    realmId: realm._id
  })
    .sort({
      name: 1
    })
    .lean();

  const properties = await _toPropertiesData(realm, dbProperties);
  res.json(properties);
};

export const one: Middlewares.AsyncRequestHandler<
  API.Landlord.Property.GetOneProperty.RequestParams,
  API.Landlord.Property.GetOneProperty.ResponseBody,
  API.Landlord.Property.GetOneProperty.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const tenantId = req.params.id;

  const dbProperty = await Collections.Property.findOne({
    _id: tenantId,
    realmId: realm._id
  }).lean();

  if (!dbProperty) throw new ServiceError('property not found', 404);

  const properties = await _toPropertiesData(realm, [dbProperty]);
  res.json(properties[0]);
};
