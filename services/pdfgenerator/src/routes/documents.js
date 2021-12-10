const express = require('express');
const Handlebars = require('handlebars');
const moment = require('moment');
const Document = require('@mre/common/models/document');
const Template = require('@mre/common/models/template');
const Tenant = require('@mre/common/models/tenant');
const Lease = require('@mre/common/models/lease');
const logger = require('winston');
const pdf = require('../pdf');

async function _getTempate(organization, templateId) {
  const template = (
    await Template.findOne({
      _id: templateId,
      realmId: organization._id,
    })
  )?.toObject();

  return template;
}

async function _getTemplateValues(organization, tenantId, leaseId) {
  const tenant = (
    await Tenant.findOne({
      _id: tenantId,
      realmId: organization._id,
    }).populate('properties.propertyId')
  )?.toObject();

  const lease = (
    await Lease.findOne({
      _id: leaseId,
      realmId: organization._id,
    })
  )?.toObject();

  moment.locale(organization.locale);
  const today = moment();
  const templateValues = {
    current: {
      date: today.format('LL'),
      location: organization.addresses[0].city,
    },

    landlord: {
      name: organization.name,
      contact: organization.contacts?.[0] || {},
      address: organization.addresses?.[0] || {},
      companyInfo: organization.companyInfo,
    },

    tenant: {
      name: tenant?.name,

      companyInfo: {
        legalRepresentative: tenant?.manager,
        legalStructure: tenant?.legalForm,
        capital: tenant?.capital,
        ein: tenant?.siret,
        dos: tenant?.rcs,
      },

      address: {
        street1: tenant?.street1,
        street2: tenant?.street2,
        zipCode: tenant?.zipCode,
        city: tenant?.city,
        state: tenant?.state,
        country: tenant?.country,
      },

      contacts:
        tenant?.contacts.map(({ contact, email, phone }) => ({
          name: contact,
          email,
          phone,
        })) || [],
    },

    properties: tenant?.properties.map(
      ({
        propertyId: {
          type,
          name,
          description,
          address,
          surface,
          phone,
          digicode,
          price,
        },
      }) => ({
        type,
        name,
        description,
        address,
        surface,
        phone,
        digicode,
        rent: price,
      })
    ),

    lease: {
      name: lease?.name,
      description: lease?.description,
      numberOfTerms: lease?.numberOfTerms,
      timeRange: lease?.timeRange,
      beginDate: moment(tenant.beginDate, 'DD/MM/YYYY').format('LL'),
      endDate: moment(tenant.endDate, 'DD/MM/YYYY').format('LL'),
      rentAmount: '????',
      expenses: '?????',
      deposit: tenant.guaranty || 0,
    },
  };

  return templateValues;
}

/**
 * route: /documents
 */
const documentsApi = express.Router();

documentsApi.get('/:document/:id/:term', async (req, res) => {
  try {
    logger.debug(`generate pdf file for ${JSON.stringify(req.params)}`);
    const pdfFile = await pdf.generate(req.params.document, req.params);
    res.download(pdfFile);
  } catch (error) {
    logger.error(error);
    res.sendStatus(404);
  }
});

documentsApi.get('/', async (req, res) => {
  const organizationId = req.headers.organizationid;

  const documentsFound = await Document.find({
    realmId: organizationId,
  });
  if (!documentsFound) {
    return res.sendStatus(404);
  }

  res.status(200).json(documentsFound);
});

documentsApi.get('/:id', async (req, res) => {
  const documentId = req.params.id;

  if (!documentId) {
    return res.sendStatus(422);
  }

  let documentFound = await Document.findOne({
    _id: documentId,
    realmId: req.realm._id,
  });

  if (!documentFound) {
    logger.warn(`document ${documentId} not found`);
    return res.sendStatus(404);
  }

  res.status(200).json(documentFound);
});

documentsApi.post('/', async (req, res) => {
  const dataSet = req.body || {}; // { name, templateId, tenantId, leaseId, type }

  if (!dataSet.tenantId) {
    return res.status(422).json({
      errors: ['Missing tenant Id to generate document'],
    });
  }

  if (!dataSet.leaseId) {
    return res.status(422).json({
      errors: ['Missing lease Id to generate document'],
    });
  }

  let template;
  if (dataSet.templateId) {
    try {
      template = await _getTempate(req.realm, dataSet.templateId);
      if (!template) {
        return res.status(404).json({
          errors: ['Template not found'],
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        errors: ['Fail to fetch template'],
      });
    }
  }

  const documentToCreate = {
    realmId: req.realm._id,
    tenantId: dataSet.tenantId,
    leaseId: dataSet.leaseId,
    name: dataSet.name,
    type: dataSet.type,
    description: dataSet.description || '',
    contents: '',
    html: '',
  };

  if (template) {
    try {
      const templateValues = await _getTemplateValues(
        req.realm,
        dataSet.tenantId,
        dataSet.leaseId
      );

      documentToCreate.name = dataSet.name || template.name;
      documentToCreate.type = dataSet.type || template.type;
      documentToCreate.contents = {
        ops: template.contents.ops.reduce((acc, op) => {
          if (typeof op.insert === 'string') {
            op.insert = Handlebars.compile(op.insert)(templateValues);
          }
          acc.push(op);
          return acc;
        }, []),
      };
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        errors: ['Fail to create document from template'],
      });
    }
  }

  try {
    const createdDocument = await Document.create(documentToCreate);
    res.status(201).json(createdDocument);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      errors: ['Fail to create document'],
    });
  }
});

documentsApi.put('/', async (req, res) => {
  const organizationId = req.headers.organizationid;
  if (!req.body._id) {
    return res.status(422).json({ errors: ['Document id is missing'] });
  }

  const { _id, tenantId, leaseId, name, type, description, contents, html } =
    req.body || {};
  const updatedDocument = await Document.findOneAndReplace(
    {
      _id,
      realmId: organizationId,
    },
    {
      realmId: organizationId,
      tenantId,
      leaseId,
      name,
      type,
      description,
      contents,
      html,
    },
    { new: true }
  );

  if (!updatedDocument) {
    return res.sendStatus(404);
  }

  res.status(201).json(updatedDocument);
});

documentsApi.delete('/:ids', async (req, res) => {
  const organizationId = req.headers.organizationid;
  const documentIds = req.params.ids.split(',');
  const result = await Document.deleteMany({
    _id: { $in: documentIds },
    realmId: organizationId,
  });

  if (result.ok !== 1) {
    logger.warn(`documents ${req.params.ids} not found`);
    return res.sendStatus(404);
  }

  res.sendStatus(204);
});

module.exports = documentsApi;
