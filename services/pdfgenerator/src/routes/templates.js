import fs from 'node:fs';
import path from 'node:path';
import {
  Collections,
  logger,
  Middlewares,
  ServiceError
} from '@microrealestate/common';
import express from 'express';
import { TEMPLATES_DIRECTORY } from '../directories';

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
  const FIELDS = JSON.parse(
    fs.readFileSync(path.join(TEMPLATES_DIRECTORY, 'fields.json'))
  );
  const templatesApi = express.Router();

  templatesApi.get('/fields', (_req, res) => {
    res.status(200).json(FIELDS);
  });

  templatesApi.get(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.realm._id;

      const templatesFound = await Collections.Template.find({
        realmId: organizationId
      })?.lean();
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

      const templateFound = await Collections.Template.findOne({
        _id: templateId,
        realmId: req.realm._id
      })?.lean();

      if (!templateFound) {
        throw new ServiceError('template not found', 404);
      }

      res.status(200).json(templateFound);
    })
  );

  templatesApi.post(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.realm._id;

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
        relatesTo,
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
        relatesTo,
        required,
        requiredOnceContractTerminated
      });

      res.status(201).json(createdTemplate);
    })
  );

  templatesApi.patch(
    '/',
    Middlewares.asyncWrapper(async (req, res) => {
      const organizationId = req.realm._id;

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
      const organizationId = req.realm._id;
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
