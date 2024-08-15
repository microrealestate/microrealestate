import {
  Collections,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import express from 'express';
import fs from 'fs';
import path from 'path';

/**
 * route: /templates
 */
const _checkTemplateParameters = ({
  name,
  type,
  hasExpiryDate,
  contents,
  html
}) => {
  const errors = [];
  if (!name) {
    errors.push('template name is missing');
  }
  if (!type) {
    errors.push('template type is missing');
  }
  if (type === 'text') {
    if (!contents) {
      errors.push('template content is missing');
    }
    if (!html) {
      errors.push('template html is missing');
    }
  } else if (type === 'fileDescriptor') {
    if (hasExpiryDate === undefined) {
      errors.push('template hasExpiryDate is missing');
    }
  }
  return errors;
};

export default function () {
  const { TEMPLATES_DIRECTORY } = Service.getInstance().envConfig.getValues();
  const FIELDS = JSON.parse(
    fs.readFileSync(path.join(TEMPLATES_DIRECTORY, 'fields.json'))
  );
  const templatesApi = express.Router();

  templatesApi.get('/fields', (req, res) => {
    res.status(200).json(FIELDS);
  });

  templatesApi.get(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.headers.organizationid;

      const templatesFound = await Collections.Template.find({
        realmId: organizationId
      });
      if (!templatesFound) {
        throw new ServiceError('templates not found', 404);
      }

      res.status(200).json(templatesFound);
    })
  );

  templatesApi.get(
    '/:id',
    Middlewares.asyncWrapper(async (req, res) => {
      const templateId = req.params.id;

      if (!templateId) {
        logger.error('missing template id field');
        throw new ServiceError('missing fields', 422);
      }

      let templateFound = await Collections.Template.findOne({
        _id: templateId,
        realmId: req.realm._id
      });

      if (!templateFound) {
        throw new ServiceError('template not found', 404);
      }

      res.status(200).json(templateFound);
    })
  );

  templatesApi.post(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.headers.organizationid;

      const errors = _checkTemplateParameters(req.body);
      if (errors.length) {
        logger.error(errors.join('\n'));
        throw new ServiceError('missing fields', 422);
      }

      const {
        name,
        type,
        description = '',
        hasExpiryDate,
        contents,
        html,
        linkedResourceIds,
        required,
        requiredOnceContractTerminated
      } = req.body || {};
      const createdTemplate = await Collections.Template.create({
        realmId: organizationId,
        name,
        type,
        description,
        hasExpiryDate,
        contents,
        html,
        linkedResourceIds,
        required,
        requiredOnceContractTerminated
      });

      res.status(201).json(createdTemplate);
    })
  );

  templatesApi.patch(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.headers.organizationid;

      let errors = _checkTemplateParameters(req.body);
      if (!req.body._id) {
        errors = ['template id is missing', ...errors];
      }
      if (errors.length) {
        logger.error(errors.join('\n'));
        throw new ServiceError('missing fields', 422);
      }

      const template = req.body || {};
      const updatedTemplate = await Collections.Template.findOneAndReplace(
        {
          _id: template._id,
          realmId: organizationId
        },
        {
          ...template,
          realmId: organizationId
        },
        { new: true }
      );

      if (!updatedTemplate) {
        throw new ServiceError('template not found', 404);
      }

      res.status(201).json(updatedTemplate);
    })
  );

  templatesApi.delete(
    '/:ids',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.headers.organizationid;
      const templateIds = req.params.ids.split(',');
      const result = await Collections.Template.deleteMany({
        _id: { $in: templateIds },
        realmId: organizationId
      });

      if (!result.acknowledged) {
        throw new ServiceError('template not found', 404);
      }

      res.sendStatus(204);
    })
  );

  return templatesApi;
}
