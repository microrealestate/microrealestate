const logger = require('winston');
const FD = require('./frontdata');
const propertyModel = require('../models/property');
const Tenant = require('@microrealestate/common/models/tenant');

async function _toPropertiesData(realm, inputProperties) {
  const allTenants = await Tenant.find({
    realmId: realm._id,
    'properties.propertyId': {
      $in: inputProperties.map(({ _id }) => _id),
    },
  });

  return inputProperties.map((property) => {
    const tenants = allTenants
      .filter(({ properties }) =>
        properties.map(({ propertyId }) => propertyId).includes(property._id)
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
function add(req, res) {
  const realm = req.realm;
  const property = propertyModel.schema.filter(req.body);

  propertyModel.add(realm, property, async (errors, dbProperty) => {
    if (errors) {
      return res.status(500).json({ errors: errors });
    }
    try {
      const properties = await _toPropertiesData(realm, [dbProperty]);
      return res.json(properties[0]);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ errors: ['cannot add the property'] });
    }
  });
}

function update(req, res) {
  const realm = req.realm;
  const property = propertyModel.schema.filter(req.body);

  propertyModel.update(realm, property, async (errors) => {
    if (errors) {
      return res.status(500).json({ errors: errors });
    }

    try {
      const properties = await _toPropertiesData(realm, [property]);
      return res.json(properties[0]);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ errors: ['cannot update the property'] });
    }
  });
}

function remove(req, res) {
  const realm = req.realm;
  const ids = req.params.ids.split(',');

  propertyModel.remove(realm, ids, (errors) => {
    if (errors) {
      return res.status(500).json({ errors: errors });
    }
    res.sendStatus(200); // better to return 204
  });
}

function all(req, res) {
  const realm = req.realm;

  propertyModel.findAll(realm, async (errors, dbProperties) => {
    if (errors && errors.length > 0) {
      return res.status(500).json({
        errors: errors,
      });
    }

    try {
      const properties = await _toPropertiesData(realm, dbProperties);
      return res.json(properties);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ errors: ['cannot fetch the properties'] });
    }
  });
}

function one(req, res) {
  const realm = req.realm;
  const tenantId = req.params.id;

  propertyModel.findOne(realm, tenantId, async (errors, dbProperty) => {
    if (errors && errors.length > 0) {
      return res.status(500).json({
        errors: errors,
      });
    }

    try {
      const properties = await _toPropertiesData(realm, [dbProperty]);
      return res.json(properties[0]);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ errors: ['cannot fetch the properties'] });
    }
  });
}

function overview(req, res) {
  const realm = req.realm;

  propertyModel.findAll(realm, async (errors, dbProperties) => {
    if (errors && errors.length > 0) {
      return res.status(500).json({
        errors: errors,
      });
    }

    try {
      const properties = await _toPropertiesData(realm, dbProperties);
      let result = {
        countAll: properties.length,
        countFree: 0,
        countBusy: 0,
      };

      properties.reduce((acc, property) => {
        if (property.available) {
          acc.countFree++;
        } else {
          acc.countBusy++;
        }
        return acc;
      }, result);

      return res.json(result);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ errors: ['cannot fetch the properties'] });
    }
  });
}

module.exports = {
  add,
  update,
  remove,
  all,
  one,
  overview,
};
