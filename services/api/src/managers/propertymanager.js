import * as FD from './frontdata.js';
import { Collections } from '@microrealestate/common';

async function _toPropertiesData(realm, inputProperties) {
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
        return t2EndDate - t1EndDate;
      });
    return FD.toProperty(property, tenants?.[0], tenants);
  });
}

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export async function add(req, res) {
  const realm = req.realm;
  const property = new Collections.Property({
    ...req.body,
    realmId: realm._id
  });
  await property.save();
  const properties = await _toPropertiesData(realm, [property]);
  return res.json(properties[0]);
}

export async function update(req, res) {
  const realm = req.realm;
  const property = req.body;

  const dbProperty = await Collections.Property.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: property._id
    },
    property,
    { new: true }
  ).lean();

  const properties = await _toPropertiesData(realm, [dbProperty]);
  return res.json(properties[0]);
}

export async function remove(req, res) {
  const realm = req.realm;
  const ids = req.params.ids.split(',');

  await Collections.Property.deleteMany({
    _id: { $in: ids },
    realmId: realm._id
  });

  res.sendStatus(200); // better to return 204
}

export async function all(req, res) {
  const realm = req.realm;

  const dbProperties = await Collections.Property.find({
    realmId: realm._id
  })
    .sort({
      name: 1
    })
    .lean();

  const properties = await _toPropertiesData(realm, dbProperties);
  return res.json(properties);
}

export async function one(req, res) {
  const realm = req.realm;
  const tenantId = req.params.id;

  const dbProperty = await Collections.Property.findOne({
    _id: tenantId,
    realmId: realm._id
  }).lean();

  const properties = await _toPropertiesData(realm, [dbProperty]);
  return res.json(properties[0]);
}
