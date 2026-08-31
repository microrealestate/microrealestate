import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Collections,
  DateFormat,
  Format,
  logger,
  Middlewares,
  ServiceError,
  Storage
} from '@microrealestate/common';
import express from 'express';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import moment from 'moment';
import * as pdf from '../pdf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// services/pdfgenerator/uploads — matches the docker-compose volume mount
// (../data/uploads:/usr/app/services/pdfgenerator/uploads).
const UPLOADS_DIRECTORY = path.join(__dirname, '..', '..', 'uploads');

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
        tenant?.contacts.map(({ name, email, phone1, phone2 }) => ({
          name,
          email,
          phone1,
          phone2
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
      beginDate: moment(tenant.beginDate, DateFormat.DATE_FORMAT).format('LL'),
      endDate: moment(tenant.endDate, DateFormat.DATE_FORMAT).format('LL'),
      deposit: Format.formatCurrency(
        organization.locale,
        organization.currency,
        tenant.expectedSecurityDeposit || 0
      )
    }
  };
  return templateValues;
}

// Authorize the receipt/rentnotice PDF download route. Landlords are already
// scoped to their organization by checkOrganization. Tenants authenticate with
// the sessionToken cookie (no realm resolved upstream): they may only download
// their own receipt/rentnotice, so we look up the requested tenant by the token
// email and scope the request realm to that tenant's own realm.
async function verifyReceiptAccess(req, res, next) {
  if (req.user.type === 'landlord') {
    return next();
  }

  if (!['receipt', 'rentnotice'].includes(req.params.document)) {
    return res.sendStatus(403);
  }

  let tenant;
  try {
    tenant = await Collections.Tenant.findOne({
      _id: req.params.id,
      'contacts.email': Middlewares.getCallerEmail(req)
    }).lean();
  } catch {
    // invalid ObjectId or malformed input -> treat as forbidden
    return res.sendStatus(403);
  }

  if (!tenant) {
    return res.sendStatus(403);
  }

  req.realm = { _id: tenant.realmId };
  return next();
}

function _resolveTemplates(element, templateValues) {
  if (element.content) {
    element.content = element.content.map((childElement) =>
      _resolveTemplates(childElement, templateValues)
    );
  }

  if (element.type === 'template') {
    element.type = 'text';
    const escapedValues = Object.fromEntries(
      Object.entries(templateValues).map(([key, value]) => [
        key,
        typeof value === 'string'
          ? Handlebars.Utils.escapeExpression(value)
          : value
      ])
    );
    element.text = Handlebars.compile(element.attrs.id)(escapedValues) || ' '; // empty text node are not allowed in tiptap editor
    element.text = element.text.replace(/&#x27;/g, "'");
    delete element.attrs;
  }
  return element;
}

export default function () {
  /**
   * routes:
   * GET    /documents/tenant/:id              -> JSON
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
  const documentsApi = express.Router();
  const uploadMiddleware = Storage.uploadMiddleware({
    uploadsDir: UPLOADS_DIRECTORY
  });

  documentsApi.get(
    '/:document/:id/:term',
    Middlewares.onlyCallers(['landlord', 'tenant']),
    Middlewares.asyncWrapper(verifyReceiptAccess),
    Middlewares.asyncWrapper(async (req, res) => {
      try {
        logger.debug(`generate pdf file for ${JSON.stringify(req.params)}`);
        const pdfFile = await pdf.generate(req.params.document, {
          ...req.params,
          realmId: req.realm?._id
        });
        // Remove the generated temp file once the download has been streamed.
        return res.download(pdfFile, (err) => {
          if (err) {
            logger.error(`error sending pdf file ${pdfFile}`);
            logger.error(err);
          }
          fs.remove(pdfFile).catch(() => {
            // best-effort cleanup — ignore if already gone
          });
        });
      } catch (error) {
        throw new ServiceError(error, 404);
      }
    })
  );

  // Every route below is landlord-only.
  documentsApi.use(Middlewares.onlyCallers(['landlord']));

  documentsApi.get(
    '/tenant/:id',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.realm._id;
      const tenantId = req.params.id;

      const documentsFound = await Collections.Document.find({
        realmId: organizationId,
        'relatesTo.tenants': { $in: [tenantId] }
      })?.lean();

      return res.status(200).json(documentsFound);
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

      const documentFound = await Collections.Document.findOne({
        _id: documentId,
        realmId: req.realm._id
      })?.lean();

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

        // Force a safe download instead of letting the browser render the
        // file inline / sniff a different content type.
        if (documentFound.mimeType) {
          res.setHeader('Content-Type', documentFound.mimeType);
        }
        res.setHeader(
          'Content-Disposition',
          Storage.contentDispositionAttachment(documentFound.name)
        );
        res.setHeader('X-Content-Type-Options', 'nosniff');

        const stream = await Storage.getDocumentStream(documentFound.url, {
          uploadsDir: UPLOADS_DIRECTORY
        });
        // Surface storage errors instead of leaving the response hanging.
        stream.on('error', (err) => {
          logger.error(`error streaming document ${documentId}`);
          logger.error(err);
          if (!res.headersSent) {
            res.status(500).end();
          } else {
            res.destroy(err);
          }
        });
        return stream.pipe(res);
      }

      logger.error(`document ${documentId} not found`);
      throw new ServiceError('document not found', 404);
    })
  );

  documentsApi.post(
    '/upload',
    uploadMiddleware,
    Middlewares.asyncWrapper(async (req, res) => {
      if (!req.file) {
        throw new ServiceError('missing fields', 422);
      }
      // The realm is known here (checkOrganization ran), so build the final
      // storage key from the staged upload and move it into the local uploads
      // directory.
      const { key, fileName } = Storage.buildStorageKey({
        realmName: req.realm.name,
        realmId: String(req.realm._id),
        folder: req.body.folder || '',
        fileName: req.body.fileName,
        mimeType: req.file.mimetype
      });
      try {
        const data = await Storage.persistUpload({
          stagedPath: req.file.path,
          key,
          fileName,
          uploadsDir: UPLOADS_DIRECTORY
        });
        return res.status(201).send(data);
      } catch (error) {
        throw new ServiceError(error, 500);
      }
    })
  );

  documentsApi.post(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const dataSet = req.body || {};

      const relatesTo = {};

      let template;
      if (dataSet.templateId) {
        relatesTo.template = dataSet.templateId;
        template = await _getTempate(req.realm, dataSet.templateId);
        if (!template) {
          throw new ServiceError('template not found', 404);
        }
      }

      if (dataSet.tenantId) {
        relatesTo.tenants = [dataSet.tenantId];
      }

      if (dataSet.leaseId) {
        relatesTo.leases = [dataSet.leaseId];
      }

      // Without a template, type and name must come from the request body.
      const type = dataSet.type || template?.type;
      const name = dataSet.name || template?.name;
      if (!type || !name) {
        throw new ServiceError('missing fields', 422);
      }

      const documentToCreate = {
        realmId: req.realm._id,
        relatesTo,
        type,
        name,
        description: dataSet.description || '',
        folder: dataSet.folder,
        createdDate: DateFormat.formatDate(dataSet.createdDate)
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
        documentToCreate.expiryDate =
          DateFormat.formatDate(dataSet.expiryDate) || '';
        documentToCreate.url = dataSet.url || '';
        if (documentToCreate.url) {
          documentToCreate.folder = `/${documentToCreate.url
            .split('/')
            .slice(1, -1)
            .join('/')}`;
        }
      }

      let createdDocument;
      try {
        createdDocument = await Collections.Document.create(documentToCreate);
      } catch (error) {
        // Avoid orphaning the already-uploaded file when record creation fails.
        if (documentToCreate.type === 'file' && documentToCreate.url) {
          await Storage.deleteDocumentFiles([{ url: documentToCreate.url }], {
            uploadsDir: UPLOADS_DIRECTORY
          }).catch(() => {});
        }
        throw error;
      }
      return res.status(201).json(createdDocument);
    })
  );

  documentsApi.patch(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.realm._id;
      if (!req.body._id) {
        logger.error('document id is missing');
        throw new ServiceError('missing fields', 422);
      }

      const doc = req.body || {};

      // Whitelist updatable fields so the client cannot overwrite ownership
      // fields (realmId, relatesTo, url, ...).
      // File content (mimeType/url) is immutable after creation.
      const editableFields = [
        'name',
        'description',
        'folder',
        'createdDate',
        'expiryDate',
        ...(doc.type === 'text' ? ['contents', 'html'] : [])
      ];

      const update = editableFields.reduce((acc, field) => {
        if (!(field in doc)) {
          return acc;
        }
        if (field === 'createdDate') {
          acc[field] = DateFormat.formatDate(doc[field]);
        } else if (field === 'expiryDate') {
          acc[field] = DateFormat.formatDate(doc[field]) || '';
        } else {
          acc[field] = doc[field];
        }
        return acc;
      }, {});

      const updatedDocument = await Collections.Document.findOneAndUpdate(
        {
          _id: doc._id,
          realmId: organizationId
        },
        { $set: update },
        { new: true }
      );

      if (!updatedDocument) {
        throw new ServiceError('document not found', 404);
      }

      return res.status(201).json(updatedDocument);
    })
  );

  // Move documents to the trash (soft delete): flag the records as deleted.
  documentsApi.patch(
    '/trash',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.realm._id;
      const ids = req.body?.ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ServiceError('missing fields', 422);
      }

      const result = await Collections.Document.updateMany(
        { _id: { $in: ids }, realmId: organizationId },
        { $set: { deletedAt: DateFormat.now() } }
      );

      return res.status(200).json({ trashed: result.matchedCount });
    })
  );

  // Permanently delete documents (bytes + record).
  documentsApi.post(
    '/purge',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.realm._id;
      const ids = req.body?.ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ServiceError('missing fields', 422);
      }

      // includeDeleted so already-trashed docs (the common purge case) are found.
      const documents = await Collections.Document.find({
        _id: { $in: ids },
        realmId: organizationId
      })
        .setOptions({ includeDeleted: true })
        .lean();

      if (!documents?.length) {
        throw new ServiceError('document not found', 404);
      }

      const fileDocs = documents.filter(
        (doc) => doc.type === 'file' && doc.url
      );

      await Storage.deleteDocumentFiles(fileDocs, {
        uploadsDir: UPLOADS_DIRECTORY
      });

      const result = await Collections.Document.deleteMany({
        _id: { $in: ids },
        realmId: organizationId
      });

      return res.status(200).json({ purged: result.deletedCount });
    })
  );

  return documentsApi;
}
