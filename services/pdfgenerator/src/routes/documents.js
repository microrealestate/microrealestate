import * as pdf from '../pdf.js';
import * as s3 from '../utils/s3.js';
import {
  Collections,
  Format,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import express from 'express';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import moment from 'moment';
import path from 'path';
import uploadMiddleware from '../utils/uploadmiddelware.js';

async function _getTempate(organization, templateId) {
  const template = await Collections.Template.findOne({
    _id: templateId,
    realmId: organization._id
  }).lean();

  return template;
}

async function _getTemplateValues(organization, tenantId, leaseId) {
  const tenant = await Collections.Tenant.findOne({
    _id: tenantId,
    realmId: organization._id
  })
    .populate('properties.propertyId')
    .lean();

  const lease = await Collections.Lease.findOne({
    _id: leaseId,
    realmId: organization._id
  }).lean();

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
    { rentAmount: 0, expensesAmount: 0, vatAmount: 0, surface: 0 }
  );

  // manage legacy discount
  if (tenant.discount) {
    PropertyGlobals.rentAmount -= tenant.discount;
  }

  // manage vat
  if (tenant.isVat && tenant.vatRatio) {
    PropertyGlobals.vatAmount =
      Math.round(
        (PropertyGlobals.rentAmount + PropertyGlobals.expensesAmount) *
          tenant.vatRatio *
          100
      ) / 100;
  }

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
      day: today.format('D'),
      month: today.format('MMMM'),
      year: today.format('YYYY'),
      location: organization.addresses?.[0]?.city
    },

    landlord: {
      name: organization.name,
      contact: organization.contacts?.[0] || {},
      address: organization.addresses?.[0] || {},
      companyInfo: landlordCompanyInfo,
      signature: organization.signature || ''
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
        ),
        allInclusiveRentAmount: Format.formatCurrency(
          organization.locale,
          organization.currency,
          PropertyGlobals.rentAmount + PropertyGlobals.expensesAmount
        ),
        allInclusiveRentWithVATAmount: Format.formatCurrency(
          organization.locale,
          organization.currency,
          PropertyGlobals.rentAmount +
            PropertyGlobals.expensesAmount +
            PropertyGlobals.vatAmount
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

  documentsApi.get(
    '/:document/:id/:term',
    Middlewares.asyncWrapper(async (req, res) => {
      try {
        logger.debug(`generate pdf file for ${JSON.stringify(req.params)}`);
        const pdfFile = await pdf.generate(req.params.document, req.params);
        return res.download(pdfFile);
      } catch (error) {
        throw new ServiceError(error, 404);
      }
    })
  );

  documentsApi.get(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.headers.organizationid;

      const documentsFound = await Collections.Document.find({
        realmId: organizationId
      });
      if (!documentsFound) {
        throw new ServiceError('document not found', 404);
      }

      return res.status(200).json(documentsFound);
    })
  );

  documentsApi.get(
    '/signature/:filename',
    Middlewares.asyncWrapper(async (req, res) => {
      const filename = req.params.filename;

      if (!filename) {
        logger.error('missing signature filename');
        throw new ServiceError('missing fields', 422);
      }

      // Decode the filename and check for path traversal
      const decodedFilename = decodeURIComponent(filename);
      if (decodedFilename.indexOf('..') !== -1) {
        logger.error('signature filename invalid containing ".."');
        throw new ServiceError('missing fields', 422);
      }

      // Check if the current organization has this signature file
      // Extract filename from the organization's signature path for comparison
      const organizationSignatureFilename = req.realm.signature
        ? req.realm.signature.split('/').pop()
        : null;

      if (
        !organizationSignatureFilename ||
        organizationSignatureFilename !== decodedFilename
      ) {
        logger.warn(
          `signature access denied for filename: ${decodedFilename}, organization signature: ${req.realm.signature}`
        );
        throw new ServiceError('signature not found', 404);
      }

      // first try to download from file system
      // Use the full signature path from the organization
      const filePath = path.join(UPLOADS_DIRECTORY, req.realm.signature);
      if (fs.existsSync(filePath)) {
        try {
          return fs.createReadStream(filePath).pipe(res);
        } catch (error) {
          logger.error(
            `cannot download signature file ${req.realm.signature} from file system`,
            error
          );
          throw new ServiceError('cannot download signature file', 404);
        }
      }

      // otherwise download from s3
      if (s3.isEnabled(req.realm.thirdParties.b2)) {
        try {
          return s3
            .downloadFile(req.realm.thirdParties.b2, req.realm.signature)
            .pipe(res);
        } catch (error) {
          logger.error(
            `cannot download signature file ${req.realm.signature} from s3`,
            error
          );
          throw new ServiceError('cannot download signature file', 404);
        }
      }

      logger.error(`signature file ${decodedFilename} not found`);
      throw new ServiceError('signature file not found', 404);
    })
  );

  documentsApi.get(
    '/:id',
    Middlewares.asyncWrapper(async (req, res) => {
      const documentId = req.params.id;

      if (!documentId) {
        logger.error('missing document id');
        throw new ServiceError('missing fields', 422);
      }

      let documentFound = await Collections.Document.findOne({
        _id: documentId,
        realmId: req.realm._id
      });

      if (!documentFound) {
        logger.warn(`document ${documentId} not found`);
        throw new ServiceError('document not found', 404);
      }

      if (documentFound.type === 'text') {
        return res.status(200).json(documentFound);
      }

      if (documentFound.type === 'file') {
        if (!documentFound?.url) {
          logger.error('document url required');
          throw new ServiceError('missing fields', 422);
        }

        if (documentFound.url.indexOf('..') !== -1) {
          logger.error('document url invalid containing ".."');
          throw new ServiceError('missing fields', 422);
        }

        // first try to download from file system
        const filePath = path.join(UPLOADS_DIRECTORY, documentFound.url);
        if (fs.existsSync(filePath)) {
          try {
            return fs.createReadStream(filePath).pipe(res);
          } catch (error) {
            logger.error(
              `cannot download file ${documentFound.url} from file system`,
              error
            );
            throw new ServiceError('cannot download file', 404);
          }
        }

        // otherwise download from s3
        if (s3.isEnabled(req.realm.thirdParties.b2)) {
          try {
            return s3
              .downloadFile(req.realm.thirdParties.b2, documentFound.url)
              .pipe(res);
          } catch (error) {
            logger.error(
              `cannot download file ${documentFound.url} from s3`,
              error
            );
            throw new ServiceError('cannot download file', 404);
          }
        }
      }

      logger.error(`document ${documentId} not found`);
      throw new ServiceError('document not found', 404);
    })
  );

  documentsApi.post(
    '/upload',
    uploadMiddleware(),
    Middlewares.asyncWrapper(async (req, res) => {
      const key = [req.body.s3Dir, req.body.fileName].join('/');
      if (s3.isEnabled(req.realm.thirdParties?.b2)) {
        try {
          const data = await s3.uploadFile(req.realm.thirdParties.b2, {
            file: req.file,
            fileName: req.body.fileName,
            url: key
          });
          return res.status(201).send(data);
        } catch (error) {
          throw new ServiceError(error, 500);
        } finally {
          try {
            fs.removeSync(req.file.path);
          } catch (err) {
            // catch error and do nothing
          }
        }
      } else {
        return res.status(201).send({
          fileName: req.body.fileName,
          key
        });
      }
    })
  );

  documentsApi.post(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const dataSet = req.body || {};

      if (!dataSet.tenantId) {
        logger.error('missing tenant Id to generate document');
        throw new ServiceError('missing fields', 422);
      }

      if (!dataSet.leaseId) {
        logger.error('missing lease Id to generate document');
        throw new ServiceError('missing fields', 422);
      }

      let template;
      if (dataSet.templateId) {
        template = await _getTempate(req.realm, dataSet.templateId);
        if (!template) {
          throw new ServiceError('template not found', 404);
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
      }

      if (documentToCreate.type === 'file') {
        documentToCreate.mimeType = dataSet.mimeType || '';
        documentToCreate.expiryDate = dataSet.expiryDate || '';
        documentToCreate.url = dataSet.url || '';
        if (dataSet.versionId) {
          documentToCreate.versionId = dataSet.versionId;
        }
      }

      const createdDocument =
        await Collections.Document.create(documentToCreate);
      return res.status(201).json(createdDocument);
    })
  );

  documentsApi.patch(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.headers.organizationid;
      if (!req.body._id) {
        logger.error('document id is missing');
        throw new ServiceError('missing fields', 422);
      }

      const doc = req.body || {};

      if (!['text'].includes(doc.type)) {
        throw new ServiceError('document cannot be modified', 405);
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
        throw new ServiceError('document not found', 404);
      }

      return res.status(201).json(updatedDocument);
    })
  );

  documentsApi.delete(
    '/:ids',
    Middlewares.asyncWrapper(async (req, res) => {
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
      if (s3.isEnabled(req.realm.thirdParties?.b2)) {
        const urlsIds = documents
          .filter((doc) => doc.type === 'file')
          .map(({ url, versionId }) => ({ url, versionId }));

        s3.deleteFiles(req.realm.thirdParties.b2, urlsIds).catch((err) => {
          logger.error('error deleting files from s3', err);
        });
      }

      // delete documents from mongo
      const result = await Collections.Document.deleteMany({
        _id: { $in: documentIds },
        realmId: organizationId
      });

      if (!result.acknowledged) {
        throw new ServiceError('document not found', 404);
      }

      return res.sendStatus(204);
    })
  );

  return documentsApi;
}
