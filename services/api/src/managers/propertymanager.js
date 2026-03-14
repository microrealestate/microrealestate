import * as FD from './frontdata.js';
import { createLog, diffObjects } from './auditlogmanager.js';
import { Collections } from '@microrealestate/common';

function _getUserFullName(req) {
  const u = req.user || {};
  return [u.firstname, u.lastname].filter(Boolean).join(' ') || u.email || '';
}

function _normalizeParentPropertyId(parentPropertyId) {
  if (parentPropertyId === undefined || parentPropertyId === null) {
    return null;
  }

  if (typeof parentPropertyId === 'string' && parentPropertyId.trim() === '') {
    return null;
  }

  return parentPropertyId;
}

function _normalizeRentField(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
}

function _normalizePropertyPayload(inputProperty) {
  const normalizeNullableString = (value) => {
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  return {
    ...inputProperty,
    parentPropertyId: _normalizeParentPropertyId(
      inputProperty.parentPropertyId
    ),
    rentLowSqftYear: _normalizeRentField(inputProperty.rentLowSqftYear),
    rentMedianSqftYear: _normalizeRentField(inputProperty.rentMedianSqftYear),
    rentHighSqftYear: _normalizeRentField(inputProperty.rentHighSqftYear),
    taxId: normalizeNullableString(inputProperty.taxId),
    countyRecordsReference: normalizeNullableString(
      inputProperty.countyRecordsReference
    ),
    coverPhotoAttachmentId: normalizeNullableString(
      inputProperty.coverPhotoAttachmentId
    ),
    floorPlanAttachmentId: normalizeNullableString(
      inputProperty.floorPlanAttachmentId
    )
  };
}

function _validateRentRange(property) {
  const rentFields = [
    ['rentLowSqftYear', property.rentLowSqftYear],
    ['rentMedianSqftYear', property.rentMedianSqftYear],
    ['rentHighSqftYear', property.rentHighSqftYear]
  ];

  for (const [fieldName, fieldValue] of rentFields) {
    if (fieldValue === null) {
      continue;
    }

    if (Number.isNaN(fieldValue)) {
      return `${fieldName} must be a valid number`;
    }

    if (fieldValue < 0) {
      return `${fieldName} must be greater than or equal to 0`;
    }
  }

  const { rentLowSqftYear, rentMedianSqftYear, rentHighSqftYear } = property;

  if (
    rentLowSqftYear !== null &&
    rentMedianSqftYear !== null &&
    rentLowSqftYear > rentMedianSqftYear
  ) {
    return 'rentLowSqftYear must be less than or equal to rentMedianSqftYear';
  }

  if (
    rentMedianSqftYear !== null &&
    rentHighSqftYear !== null &&
    rentMedianSqftYear > rentHighSqftYear
  ) {
    return 'rentMedianSqftYear must be less than or equal to rentHighSqftYear';
  }

  if (
    rentLowSqftYear !== null &&
    rentHighSqftYear !== null &&
    rentLowSqftYear > rentHighSqftYear
  ) {
    return 'rentLowSqftYear must be less than or equal to rentHighSqftYear';
  }

  return null;
}

async function _validateParentPropertyId(
  realmId,
  parentPropertyId,
  propertyId
) {
  if (!parentPropertyId) {
    return null;
  }

  if (propertyId && String(parentPropertyId) === String(propertyId)) {
    return 'parentPropertyId cannot reference the same property';
  }

  const parentProperty = await Collections.Property.findOne({
    _id: parentPropertyId,
    realmId
  }).lean();

  if (!parentProperty) {
    return 'parentPropertyId must reference an existing property in this realm';
  }

  return null;
}

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
  const propertyData = _normalizePropertyPayload(req.body);

  const rentValidationError = _validateRentRange(propertyData);
  if (rentValidationError) {
    return res.status(400).json({ message: rentValidationError });
  }

  const parentValidationError = await _validateParentPropertyId(
    realm._id,
    propertyData.parentPropertyId
  );
  if (parentValidationError) {
    return res.status(400).json({ message: parentValidationError });
  }

  const lastUpdatedBy = _getUserFullName(req);
  const property = new Collections.Property({
    ...propertyData,
    realmId: realm._id,
    lastUpdatedBy
  });
  await property.save();
  await createLog(
    req,
    'create',
    'property',
    property._id,
    propertyData.name || ''
  );
  const properties = await _toPropertiesData(realm, [property]);
  return res.json(properties[0]);
}

export async function update(req, res) {
  const realm = req.realm;
  const propertyId = req.params.id;
  const property = _normalizePropertyPayload(req.body);

  if (property._id && String(property._id) !== String(propertyId)) {
    return res.status(400).json({
      message: 'Property id mismatch between URL parameter and payload'
    });
  }

  const rentValidationError = _validateRentRange(property);
  if (rentValidationError) {
    return res.status(400).json({ message: rentValidationError });
  }

  const parentValidationError = await _validateParentPropertyId(
    realm._id,
    property.parentPropertyId,
    propertyId
  );
  if (parentValidationError) {
    return res.status(400).json({ message: parentValidationError });
  }

  const { _id, ...propertyToUpdate } = property;
  const lastUpdatedBy = _getUserFullName(req);

  const oldProperty = await Collections.Property.findOne({
    realmId: realm._id,
    _id: propertyId
  }).lean();

  const dbProperty = await Collections.Property.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: propertyId
    },
    { ...propertyToUpdate, lastUpdatedBy },
    { new: true }
  ).lean();

  if (!dbProperty) {
    return res.status(404).json({ message: 'Property not found' });
  }

  const changes = diffObjects(oldProperty, propertyToUpdate);
  await createLog(
    req,
    'update',
    'property',
    propertyId,
    dbProperty.name || '',
    changes
  );

  const properties = await _toPropertiesData(realm, [dbProperty]);
  return res.json(properties[0]);
}

export async function remove(req, res) {
  const realm = req.realm;
  const ids = req.params.ids.split(',');

  const deleted = await Collections.Property.find({
    _id: { $in: ids },
    realmId: realm._id
  }).lean();

  await Collections.Property.deleteMany({
    _id: { $in: ids },
    realmId: realm._id
  });

  for (const prop of deleted) {
    await createLog(req, 'delete', 'property', prop._id, prop.name || '');
  }

  res.sendStatus(200);
}

export async function all(req, res) {
  const realm = req.realm;
  const { parentPropertyId } = req.query;

  const query = {
    realmId: realm._id
  };

  if (parentPropertyId !== undefined) {
    query.parentPropertyId =
      parentPropertyId === '' || parentPropertyId === 'null'
        ? null
        : parentPropertyId;
  }

  const dbProperties = await Collections.Property.find(query)
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

export async function units(req, res) {
  const realm = req.realm;
  const { id } = req.params;

  const dbProperties = await Collections.Property.find({
    realmId: realm._id,
    parentPropertyId: id
  })
    .sort({
      name: 1
    })
    .lean();

  const properties = await _toPropertiesData(realm, dbProperties);
  return res.json(properties);
}
