// eslint-disable-next-line import/no-unresolved
import { Collections } from '@microrealestate/common';
import express from 'express';

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
  const templatesApi = express.Router();

  templatesApi.get('/fields', (req, res) => {
    res.status(200).json([
      {
        _id: 'current_location',
        marker: '{{current.location}}',
        type: 'string'
      },
      {
        _id: 'current_date',
        marker: '{{current.date}}',
        type: 'date'
      },
      {
        _id: 'landlord_name',
        marker: '{{landlord.name}}',
        type: 'string'
      },
      {
        _id: 'landlord_contact_phone1',
        marker: '{{landlord.contact.phone1}}',
        type: 'string'
      },
      {
        _id: 'landlord_contact_phone2',
        marker: '{{landlord.contact.phone2}}',
        type: 'string'
      },
      {
        _id: 'landlord_contact_email',
        marker: '{{landlord.contact.email}}',
        type: 'string'
      },
      {
        _id: 'landlord_address_street1',
        marker: '{{landlord.address.street1}}',
        type: 'string'
      },
      {
        _id: 'landlord_address_street2',
        marker: '{{landlord.address.street2}}',
        type: 'string'
      },
      {
        _id: 'landlord_address_city',
        marker: '{{landlord.address.city}}',
        type: 'string'
      },
      {
        _id: 'landlord_address_state',
        marker: '{{landlord.address.state}}',
        type: 'string'
      },
      {
        _id: 'landlord_address_country',
        marker: '{{landlord.address.country}}',
        type: 'string'
      },
      {
        _id: 'landlord_address_zipCode',
        marker: '{{landlord.address.zipCode}}',
        type: 'string'
      },
      {
        _id: 'landlord_companyInfo_legalRepresentative',
        marker: '{{landlord.companyInfo.legalRepresentative}}',
        type: 'string'
      },
      {
        _id: 'landlord_companyInfo_legalStructure',
        marker: '{{landlord.companyInfo.legalStructure}}',
        type: 'string'
      },
      {
        _id: 'landlord_companyInfo_capital',
        marker: '{{landlord.companyInfo.capital}}',
        type: 'amount'
      },
      {
        _id: 'landlord_companyInfo_ein',
        marker: '{{landlord.companyInfo.ein}}',
        type: 'string'
      },
      {
        _id: 'landlord_companyInfo_dos',
        marker: '{{landlord.companyInfo.dos}}',
        type: 'string'
      },
      {
        _id: 'landlord_companyInfo_vatNumber',
        marker: '{{landlord.companyInfo.vatNumber}}',
        type: 'string'
      },
      {
        _id: 'tenant_name',
        marker: '{{tenant.name}}',
        type: 'string'
      },
      {
        _id: 'tenant_contacts_name',
        marker: '{{tenant.contacts.[0].name}}',
        type: 'string'
      },
      {
        _id: 'tenant_contacts_phone1',
        marker: '{{tenant.contacts.[0].phone1}}',
        type: 'string'
      },
      {
        _id: 'tenant_contacts_phone2',
        marker: '{{tenant.contacts.[0].phone2}}',
        type: 'string'
      },
      {
        _id: 'tenant_contacts_email',
        marker: '{{tenant.contacts.[0].email}}',
        type: 'string'
      },
      {
        _id: 'tenant_address_street1',
        marker: '{{tenant.address.street1}}',
        type: 'string'
      },
      {
        _id: 'tenant_address_street2',
        marker: '{{tenant.address.street2}}',
        type: 'string'
      },
      {
        _id: 'tenant_address_city',
        marker: '{{tenant.address.city}}',
        type: 'string'
      },
      {
        _id: 'tenant_address_state',
        marker: '{{tenant.address.state}}',
        type: 'string'
      },
      {
        _id: 'tenant_address_country',
        marker: '{{tenant.address.country}}',
        type: 'string'
      },
      {
        _id: 'tenant_address_zipCode',
        marker: '{{tenant.address.zipCode}}',
        type: 'string'
      },
      {
        _id: 'tenant_companyInfo_legalRepresentative',
        marker: '{{tenant.companyInfo.legalRepresentative}}',
        type: 'string'
      },
      {
        _id: 'tenant_companyInfo_legalStructure',
        marker: '{{tenant.companyInfo.legalStructure}}',
        type: 'string'
      },
      {
        _id: 'tenant_companyInfo_capital',
        marker: '{{tenant.companyInfo.capital}}',
        type: 'amount'
      },
      {
        _id: 'tenant_companyInfo_ein',
        marker: '{{tenant.companyInfo.ein}}',
        type: 'string'
      },
      {
        _id: 'tenant_companyInfo_dos',
        marker: '{{tenant.companyInfo.dos}}',
        type: 'string'
      },
      {
        _id: 'properties_name',
        marker: '{{properties.list.[0].name}}',
        type: 'string'
      },
      {
        _id: 'properties_description',
        marker: '{{properties.list.[0].description}}',
        type: 'string'
      },
      {
        _id: 'properties_type',
        marker: '{{properties.list.[0].type}}',
        type: 'string'
      },
      {
        _id: 'properties_surface',
        marker: '{{properties.list.[0].surface}}',
        type: 'surface'
      },
      {
        _id: 'properties_total_surface',
        marker: '{{properties.total.surface}}',
        type: 'surface'
      },
      {
        _id: 'properties_rent',
        marker: '{{properties.list.[0].rent}}',
        type: 'amount'
      },
      {
        _id: 'properties_phone',
        marker: '{{properties.list.[0].phone}}',
        type: 'string'
      },
      {
        _id: 'properties_digicode',
        marker: '{{properties.list.[0].digicode}}',
        type: 'string'
      },
      {
        _id: 'properties_address_street1',
        marker: '{{properties.list.[0].address.street1}}',
        type: 'string'
      },
      {
        _id: 'properties_address_street2',
        marker: '{{properties.list.[0].address.street2}}',
        type: 'string'
      },
      {
        _id: 'properties_address_city',
        marker: '{{properties.list.[0].address.city}}',
        type: 'string'
      },
      {
        _id: 'properties_address_state',
        marker: '{{properties.list.[0].address.state}}',
        type: 'string'
      },
      {
        _id: 'properties_address_country',
        marker: '{{properties.list.[0].address.country}}',
        type: 'string'
      },
      {
        _id: 'properties_address_zipCode',
        marker: '{{properties.list.[0].address.zipCode}}',
        type: 'string'
      },
      {
        _id: 'lease_reference',
        marker: '{{lease.reference}}',
        type: 'string'
      },
      {
        _id: 'lease_beginDate',
        marker: '{{lease.beginDate}}',
        type: 'date'
      },
      {
        _id: 'lease_endDate',
        marker: '{{lease.endDate}}',
        type: 'date'
      },
      {
        _id: 'lease_deposit',
        marker: '{{lease.deposit}}',
        type: 'amount'
      },
      {
        _id: 'lease_rentAmount',
        marker: '{{properties.total.rentAmount}}',
        type: 'amount'
      },
      {
        _id: 'lease_expensesAmount',
        marker: '{{properties.total.expensesAmount}}',
        type: 'amount'
      }
    ]);
  });

  templatesApi.get('/', (req, res) => {
    const request = async () => {
      const organizationId = req.headers.organizationid;

      const templatesFound = await Collections.Template.find({
        realmId: organizationId
      });
      if (!templatesFound) {
        return res.sendStatus(404);
      }

      res.status(200).json(templatesFound);
    };
    request();
  });

  templatesApi.get('/:id', (req, res) => {
    const request = async () => {
      const templateId = req.params.id;

      if (!templateId) {
        return res.sendStatus(422);
      }

      let templateFound = await Collections.Template.findOne({
        _id: templateId,
        realmId: req.realm._id
      });

      if (!templateFound) {
        return res.sendStatus(404);
      }

      res.status(200).json(templateFound);
    };
    request();
  });

  templatesApi.post('/', (req, res) => {
    const request = async () => {
      const organizationId = req.headers.organizationid;

      const errors = _checkTemplateParameters(req.body);
      if (errors.length) {
        return res.status(422).json({ errors });
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
    };
    request();
  });

  templatesApi.patch('/', (req, res) => {
    const request = async () => {
      const organizationId = req.headers.organizationid;

      let errors = _checkTemplateParameters(req.body);
      if (!req.body._id) {
        errors = ['template id is missing', ...errors];
      }
      if (errors.length) {
        return res.status(422).json({ errors });
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
        return res.sendStatus(404);
      }

      res.status(201).json(updatedTemplate);
    };
    request();
  });

  templatesApi.delete('/:ids', (req, res) => {
    const request = async () => {
      const organizationId = req.headers.organizationid;
      const templateIds = req.params.ids.split(',');
      const result = await Collections.Template.deleteMany({
        _id: { $in: templateIds },
        realmId: organizationId
      });

      if (!result.acknowledged) {
        return res.sendStatus(404);
      }

      res.sendStatus(204);
    };
    request();
  });

  return templatesApi;
}
