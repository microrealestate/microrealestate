import {
  Collections,
  DateFormat,
  type Middlewares,
  ServiceError
} from '@microrealestate/common';
import type {
  API,
  PropertyCustomField,
  PropertyKind,
  PropertyType,
  TenantType
} from '@microrealestate/shared';
import { canContain, customFieldNameKey } from '@microrealestate/shared';
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

type CompositionUnit = Pick<PropertyType, '_id' | 'type' | 'parentId'>;

async function _compositionUnits(
  realm: NonNullable<Express.Request['realm']>
): Promise<CompositionUnit[]> {
  const units = await Collections.Property.find(
    { realmId: realm._id },
    { _id: 1, type: 1, parentId: 1 }
  ).lean();
  return units.map(({ _id, type, parentId }) => ({
    _id: String(_id),
    type,
    parentId
  }));
}

function _kindLabel(kind: PropertyKind | undefined) {
  return kind ?? 'unit without type';
}

export function compositionError(
  units: CompositionUnit[],
  unit: { _id?: string; type?: PropertyKind; parentId?: string }
): string | undefined {
  // rules on the parent side: only when the property goes under another one
  if (unit.parentId) {
    // a property cannot be its own parent
    if (unit.parentId === unit._id) {
      return 'a unit cannot contain itself';
    }
    // the parent must exist in this organization (units holds only its
    // properties)
    const unitsById = new Map(units.map((u) => [String(u._id), u]));
    const parent = unitsById.get(unit.parentId);
    if (!parent) {
      return 'parent unit not found';
    }
    // the parent's kind must accept this kind, see PROPERTY_KIND_CHILDREN
    if (!canContain(parent.type, unit.type)) {
      return `${_kindLabel(parent.type)} cannot contain ${_kindLabel(unit.type)}`;
    }
    // walk up from the parent: meeting this property means it would sit under
    // its own sub-property.
    // the kind matrix has no loop, so only data that already holds a cycle
    // can reach this; `visited` keeps the walk finite on such data
    if (unit._id) {
      const visited = new Set<string>();
      let ancestor: CompositionUnit | undefined = parent;
      while (ancestor?.parentId && !visited.has(String(ancestor._id))) {
        if (ancestor.parentId === unit._id) {
          return 'a unit cannot be linked under one of its own sub-units';
        }
        visited.add(String(ancestor._id));
        ancestor = unitsById.get(ancestor.parentId);
      }
    }
  }

  // rules on the children side: after a kind change, each current sub-property
  // must still be accepted by the new kind. A property not created yet has no
  // children.
  if (unit._id) {
    const child = units.find(
      (u) => u.parentId === unit._id && !canContain(unit.type, u.type)
    );
    if (child) {
      return `${_kindLabel(unit.type)} cannot contain ${_kindLabel(child.type)}`;
    }
  }
}

const MAX_CUSTOM_FIELDS = 50;
const MAX_LABEL_LENGTH = 100;
const MAX_VALUE_LENGTH = 500;
const MAX_NOTES_LENGTH = 5000;

export function normalizeCustomFields(input: unknown): PropertyCustomField[] {
  if (input === undefined || input === null) {
    return [];
  }
  if (!Array.isArray(input)) {
    throw new ServiceError('customFields must be an array', 422);
  }
  if (input.length > MAX_CUSTOM_FIELDS) {
    throw new ServiceError(
      `a property holds at most ${MAX_CUSTOM_FIELDS} custom fields`,
      422
    );
  }
  const fields = input.map((field) => {
    const { label, value } = (field ?? {}) as Record<string, unknown>;
    const trimmedLabel = typeof label === 'string' ? label.trim() : '';
    if (!trimmedLabel || trimmedLabel.length > MAX_LABEL_LENGTH) {
      throw new ServiceError(
        `custom field label must be 1 to ${MAX_LABEL_LENGTH} characters`,
        422
      );
    }
    const text = value === undefined || value === null ? '' : String(value);
    if (text.length > MAX_VALUE_LENGTH) {
      throw new ServiceError(
        `custom field value must be at most ${MAX_VALUE_LENGTH} characters`,
        422
      );
    }
    return { label: trimmedLabel, value: text };
  });
  const names = new Set(fields.map(({ label }) => customFieldNameKey(label)));
  if (names.size !== fields.length) {
    throw new ServiceError('custom field names must be unique', 422);
  }
  return fields;
}

function _normalizeDetails(
  fields: Pick<Partial<PropertyType>, 'notes' | 'customFields'>
) {
  if ('notes' in fields) {
    if (fields.notes != null && typeof fields.notes !== 'string') {
      throw new ServiceError('notes must be a text', 422);
    }
    if ((fields.notes?.length ?? 0) > MAX_NOTES_LENGTH) {
      throw new ServiceError(
        `notes must be at most ${MAX_NOTES_LENGTH} characters`,
        422
      );
    }
  }
  if ('customFields' in fields) {
    fields.customFields = normalizeCustomFields(fields.customFields);
  }
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

  const { parentId, ...fields } = req.body as typeof req.body & {
    _id?: unknown;
  };
  delete fields._id;

  if (typeof fields.availableForRent !== 'boolean') {
    throw new ServiceError('availableForRent must be true or false', 422);
  }
  _normalizeDetails(fields);

  if (parentId) {
    const error = compositionError(await _compositionUnits(realm), {
      type: fields.type,
      parentId
    });
    if (error) throw new ServiceError(error, 422);
  }

  const property = new Collections.Property({
    ...fields,
    ...(parentId ? { parentId } : {}),
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

  const propertyId = req.params.id;
  const { parentId, ...fields } = req.body as Partial<typeof req.body> & {
    realmId?: unknown;
  };
  delete fields._id;
  delete fields.realmId;

  if (
    'availableForRent' in fields &&
    typeof fields.availableForRent !== 'boolean'
  ) {
    throw new ServiceError('availableForRent must be true or false', 422);
  }
  _normalizeDetails(fields);

  const units = await _compositionUnits(realm);
  const currentUnit = units.find(({ _id }) => _id === propertyId);
  if (!currentUnit) throw new ServiceError('property not found', 404);

  // parentId: absent keeps the current parent, null or '' unlinks. A parent
  // deleted without unlinking its sub-units is dropped rather than rejected.
  const keptParentId = units.some(({ _id }) => _id === currentUnit.parentId)
    ? currentUnit.parentId
    : undefined;
  const nextParentId =
    parentId === undefined ? keptParentId : parentId || undefined;
  const error = compositionError(units, {
    _id: propertyId,
    type: 'type' in fields ? fields.type : currentUnit.type,
    parentId: nextParentId
  });
  if (error) throw new ServiceError(error, 422);

  const dbProperty = await Collections.Property.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: propertyId
    },
    nextParentId
      ? { $set: { ...fields, parentId: nextParentId } }
      : { $set: fields, $unset: { parentId: 1 } },
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

  // the sub-units of a deleted unit become standalone; unlinking first keeps
  // the data consistent if the delete fails
  await Collections.Property.updateMany(
    { realmId: realm._id, parentId: { $in: ids } },
    { $unset: { parentId: 1 } }
  );
  await Collections.Property.deleteMany({
    _id: { $in: ids },
    realmId: realm._id
  });

  res.sendStatus(200); // better to return 204
};

export const attach: Middlewares.AsyncRequestHandler<
  API.Landlord.Property.PostAttachProperties.RequestParams,
  API.Landlord.Property.PostAttachProperties.ResponseBody,
  API.Landlord.Property.PostAttachProperties.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const parentId = req.params.id;
  const ids = [...new Set((req.body?.ids ?? []).map(String))];
  if (!ids.length) throw new ServiceError('no property to attach', 422);

  const units = await _compositionUnits(realm);
  if (!units.some(({ _id }) => _id === parentId)) {
    throw new ServiceError('property not found', 404);
  }

  for (const id of ids) {
    const unit = units.find(({ _id }) => _id === id);
    if (!unit) throw new ServiceError('property not found', 404);
    const error = compositionError(units, {
      _id: id,
      type: unit.type,
      parentId
    });
    if (error) throw new ServiceError(error, 422);
  }

  await Collections.Property.updateMany(
    { realmId: realm._id, _id: { $in: ids } },
    { $set: { parentId } }
  );

  const dbProperties = await Collections.Property.find({
    realmId: realm._id,
    _id: { $in: ids }
  }).lean();
  res.json(await _toPropertiesData(realm, dbProperties));
};

export const detach: Middlewares.AsyncRequestHandler<
  API.Landlord.Property.DeleteDetachProperties.RequestParams,
  API.Landlord.Property.DeleteDetachProperties.ResponseBody,
  API.Landlord.Property.DeleteDetachProperties.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  await Collections.Property.updateMany(
    {
      realmId: realm._id,
      parentId: req.params.id,
      _id: { $in: req.params.ids.split(',') }
    },
    { $unset: { parentId: 1 } }
  );

  res.sendStatus(200);
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
