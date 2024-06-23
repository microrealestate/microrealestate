import * as pdf from '../pdf.js';
import * as s3 from '../utils/s3.js';
// eslint-disable-next-line import/no-unresolved
import { Collections, Format, Service } from '@microrealestate/common';
import express from 'express';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import logger from 'winston';
import moment from 'moment';
import multer from 'multer';
import path from 'path';
import uploadMiddleware from '../utils/uploadmiddelware.js';

async function _getTempate(organization, templateId) {
  const template = (
    await Collections.Template.findOne({
      _id: templateId,
      realmId: organization._id
    })
  )?.toObject();

  return template;
}

async function _getTemplateValues(organization, tenantId, leaseId) {
  const tenant = (
    await Collections.Tenant.findOne({
      _id: tenantId,
      realmId: organization._id
    }).populate('properties.propertyId')
  )?.toObject();

  const lease = (
    await Collections.Lease.findOne({
      _id: leaseId,
      realmId: organization._id
    })
  )?.toObject();

  // compute rent, expenses and surface from properties
  const PropertyGlobals = tenant.properties.reduce(
    (acc, { rent, expenses = [], property: { surface } }) => {
      acc.rentAmount += rent;
      acc.expensesAmount +=
        expenses.reduce((sum, { amount }) => {
          sum += amount;
          return sum;
        }, 0) || 0;
      acc.surface += surface;
      return acc;
    },
    { rentAmount: 0, expensesAmount: 0, surface: 0 }
  );

  const landlordCompanyInfo = organization.companyInfo
    ? {
        ...organization.companyInfo,
        capital: organization.companyInfo.capital
          ? Format.formatCurrency(
              organization.locale,
              organization.currency,
              organization.companyInfo.capital
            )
          : ''
      }
    : null;

  moment.locale(organization.locale);
  const today = moment();
  const templateValues = {
    current: {
      date: today.format('LL'),
      location: organization.addresses?.[0]?.city
    },

    landlord: {
      name: organization.name,
      contact: organization.contacts?.[0] || {},
      address: organization.addresses?.[0] || {},
      companyInfo: landlordCompanyInfo
    },

    tenant: {
      name: tenant?.name,

      companyInfo: {
        legalRepresentative: tenant?.manager,
        legalStructure: tenant?.legalForm,
        capital: tenant?.capital
          ? Format.formatCurrency(
              organization.locale,
              organization.currency,
              tenant.capital
            )
          : '',
        ein: tenant?.siret,
        dos: tenant?.rcs
      },

      address: {
        street1: tenant?.street1,
        street2: tenant?.street2,
        zipCode: tenant?.zipCode,
        city: tenant?.city,
        state: tenant?.state,
        country: tenant?.country
      },

      contacts:
        tenant?.contacts.map(({ contact, email, phone }) => ({
          name: contact,
          email,
          phone
        })) || []
    },

    properties: {
      total: {
        surface: Format.formatNumber(
          organization.locale,
          PropertyGlobals.surface
        ),
        rentAmount: Format.formatCurrency(
          organization.locale,
          organization.currency,
          PropertyGlobals.rentAmount
        ),
        expensesAmount: Format.formatCurrency(
          organization.locale,
          organization.currency,
          PropertyGlobals.expensesAmount
        )
      },
      list: tenant?.properties.map(
        ({
          propertyId: {
            name,
            description,
            type,
            surface,
            phone,
            address,
            digicode,
            price
          }
        }) => ({
          name,
          description,
          type,
          rent: Format.formatCurrency(
            organization.locale,
            organization.currency,
            price
          ),
          surface: Format.formatNumber(organization.locale, surface),
          phone,
          address,
          digicode
        })
      )
    },

    lease: {
      name: lease?.name,
      description: lease?.description,
      numberOfTerms: lease?.numberOfTerms,
      timeRange: lease?.timeRange,
      beginDate: moment(tenant.beginDate).format('LL'),
      endDate: moment(tenant.endDate).format('LL'),
      deposit: Format.formatCurrency(
        organization.locale,
        organization.currency,
        tenant.guaranty || 0
      )
    }
  };
  return templateValues;
}

function _resolveTemplates(element, templateValues) {
  if (element.content) {
    element.content = element.content.map((childElement) =>
      _resolveTemplates(childElement, templateValues)
    );
  }

  if (element.type === 'template') {
    element.type = 'text';
    element.text = Handlebars.compile(element.attrs.id)(templateValues) || ' '; // empty text node are not allowed in tiptap editor
    // TODO check if this doesn't open XSS issues
    element.text = element.text.replace(/&#x27;/g, "'");
    delete element.attrs;
  }
  return element;
}

export default function () {
  /**
   * routes:
   * GET    /documents                         -> JSON
   * GET    /documents/:id                     -> JSON | pdf | image file
   * GET    /documents/:document/:id/:term     -> pdf file
   * POST   /documents/upload                  -> JSON
   * (input: FormData with pdf or image file)
   * POST   /documents                         -> JSON
   * (input: Document model)
   * PATCH  /documents                         -> JSON
   * input: Document model
   * DELETE /documents/:ids
   */
  const { UPLOADS_DIRECTORY } = Service.getInstance().envConfig.getValues();
  const documentsApi = express.Router();

  documentsApi.get('/:document/:id/:term', async (req, res) => {
    try {
      logger.debug(`generate pdf file for ${JSON.stringify(req.params)}`);
      const pdfFile = await pdf.generate(req.params.document, req.params);
      return res.download(pdfFile);
    } catch (error) {
      logger.error(error);
      return res.sendStatus(404);
    }
  });

  documentsApi.get('/', async (req, res) => {
    const organizationId = req.headers.organizationid;

    const documentsFound = await Collections.Document.find({
      realmId: organizationId
    });
    if (!documentsFound) {
      return res.sendStatus(404);
    }

    return res.status(200).json(documentsFound);
  });

  documentsApi.get('/:id', async (req, res) => {
    const documentId = req.params.id;

    if (!documentId) {
      return res.status(422).send({ errors: ['Document id required'] });
    }

    let documentFound = await Collections.Document.findOne({
      _id: documentId,
      realmId: req.realm._id
    });

    if (!documentFound) {
      logger.warn(`document ${documentId} not found`);
      return res
        .status(404)
        .send({ errors: [`Document ${documentId} not found`] });
    }

    if (documentFound.type === 'text') {
      return res.status(200).json(documentFound);
    }

    if (documentFound.type === 'file') {
      if (!documentFound?.url) {
        return res.status(404).send({ errors: ['Document url required'] });
      }

      if (documentFound.url.indexOf('..') !== -1) {
        return res.status(404).send({ errors: ['Document url invalid'] });
      }

      // first try to download from file system
      const filePath = path.join(UPLOADS_DIRECTORY, documentFound.url);
      if (fs.existsSync(filePath)) {
        return fs.createReadStream(filePath).pipe(res);
      }

      // otherwise download from s3
      if (s3.isEnabled(req.realm.thirdParties.b2)) {
        return s3
          .downloadFile(req.realm.thirdParties.b2, documentFound.url)
          .pipe(res);
      }
    }

    return res
      .status(404)
      .send({ errors: [`Document ${documentId} not found`] });
  });

  documentsApi.post('/upload', (req, res) => {
    uploadMiddleware()(req, res, async (err) => {
      if (err) {
        logger.error(err);
        if (err instanceof multer.MulterError) {
          return res.status(500).send({ errors: [err.message] });
        }
        return res.status(500).send({ errors: ['Cannot store file on disk'] });
      }

      const key = [req.body.s3Dir, req.body.fileName].join('/');
      if (s3.isEnabled(req.realm.thirdParties.b2)) {
        try {
          const data = await s3.uploadFile(req.realm.thirdParties.b2, {
            file: req.file,
            fileName: req.body.fileName,
            url: key
          });
          return res.status(201).send(data);
        } catch (error) {
          logger.error(error);
          return res.status(500).send({ errors: ['Cannot store file in s3'] });
        } finally {
          try {
            fs.removeSync(req.file.path);
          } catch (err) {
            // catch error
          }
        }
      } else {
        return res.status(201).send({
          fileName: req.body.fileName,
          key
        });
      }
    });
  });

  documentsApi.post('/', async (req, res) => {
    const dataSet = req.body || {};

    if (!dataSet.tenantId) {
      return res.status(422).json({
        errors: ['Missing tenant Id to generate document']
      });
    }

    if (!dataSet.leaseId) {
      return res.status(422).json({
        errors: ['Missing lease Id to generate document']
      });
    }

    let template;
    if (dataSet.templateId) {
      try {
        template = await _getTempate(req.realm, dataSet.templateId);
        if (!template) {
          return res.status(404).json({
            errors: ['Template not found']
          });
        }
      } catch (error) {
        logger.error(error);
        return res.status(500).json({
          errors: ['Fail to fetch template']
        });
      }
    }

    const documentToCreate = {
      realmId: req.realm._id,
      tenantId: dataSet.tenantId,
      leaseId: dataSet.leaseId,
      templateId: dataSet.templateId,
      type: dataSet.type || template.type,
      name: dataSet.name || template.name,
      description: dataSet.description || ''
    };

    if (documentToCreate.type === 'text') {
      try {
        documentToCreate.contents = '';
        documentToCreate.html = '';
        if (template) {
          const templateValues = await _getTemplateValues(
            req.realm,
            dataSet.tenantId,
            dataSet.leaseId
          );

          documentToCreate.contents = _resolveTemplates(
            template.contents,
            templateValues
          );
        }
      } catch (error) {
        logger.error(error);
        return res.status(500).json({
          errors: ['Fail to create document from template']
        });
      }
    }

    if (documentToCreate.type === 'file') {
      documentToCreate.mimeType = dataSet.mimeType || '';
      documentToCreate.expiryDate = dataSet.expiryDate || '';
      documentToCreate.url = dataSet.url || '';
      if (dataSet.versionId) {
        documentToCreate.versionId = dataSet.versionId;
      }
    }

    try {
      const createdDocument =
        await Collections.Document.create(documentToCreate);
      return res.status(201).json(createdDocument);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        errors: ['Fail to create document']
      });
    }
  });

  documentsApi.patch('/', async (req, res) => {
    const organizationId = req.headers.organizationid;
    if (!req.body._id) {
      return res.status(422).json({ errors: ['Document id is missing'] });
    }

    const doc = req.body || {};

    if (!['text'].includes(doc.type)) {
      return res.status(405).json({ errors: ['Document cannot be modified'] });
    }

    const updatedDocument = await Collections.Document.findOneAndUpdate(
      {
        _id: doc._id,
        realmId: organizationId
      },
      {
        $set: {
          ...doc,
          realmId: organizationId
        }
      },
      { new: true }
    );

    if (!updatedDocument) {
      return res.sendStatus(404);
    }

    return res.status(201).json(updatedDocument);
  });

  documentsApi.delete('/:ids', async (req, res) => {
    const organizationId = req.headers.organizationid;
    const documentIds = req.params.ids.split(',');

    // fetch documents
    const documents = await Collections.Document.find({
      _id: { $in: documentIds },
      realmId: organizationId
    });

    // delete documents from file systems
    documents.forEach((doc) => {
      if (doc.type !== 'file' || doc.url.indexOf('..') !== -1) {
        return;
      }
      const filePath = path.join(UPLOADS_DIRECTORY, doc.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // delete document from s3
    if (s3.isEnabled(req.realm.thirdParties.b2)) {
      const urlsIds = documents
        .filter((doc) => doc.type === 'file')
        .map(({ url, versionId }) => ({ url, versionId }));

      s3.deleteFiles(req.realm.thirdParties.b2, urlsIds);
    }

    // delete documents from mongo
    const result = await Collections.Document.deleteMany({
      _id: { $in: documentIds },
      realmId: organizationId
    });

    if (!result.acknowledged) {
      logger.warn(`documents ${req.params.ids} not found`);
      return res.sendStatus(404);
    }

    return res.sendStatus(204);
  });

  return documentsApi;
}
