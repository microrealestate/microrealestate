import {
  Collections,
  type Middlewares,
  ServiceError
} from '@microrealestate/common';
import type { API, PropertyType } from '@microrealestate/shared';
import * as FD from './frontdata';

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

  return inputProperties.map((property) => {
    const tenants = allTenants
      .filter(({ properties }) =>
        properties
          .map(({ propertyId }) => propertyId)
          .includes(String(property._id))
      )
      .sort((t1, t2) => {
        const t1EndDate = t1.terminationDate || t1.endDate;
        const t2EndDate = t2.terminationDate || t2.endDate;
        return Number(t2EndDate) - Number(t1EndDate);
      });
    return FD.toProperty(property, tenants?.[0], tenants);
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
