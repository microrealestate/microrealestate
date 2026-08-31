import {
  Collections,
  formatError,
  logger,
  type Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import type { API } from '@microrealestate/shared';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import type { Request } from 'express';
import moment from 'moment';

interface EmailMessage {
  name: string;
  tenantId: string;
  document: string;
  term: number;
}

interface EmailerResponseItem {
  templateName: string;
  recordId: string;
  params: { term: number };
  email: string;
  status: string;
}

interface EmailResult {
  document: string;
  tenantId: string;
  term: number;
  email: string;
  status: string;
}

async function _sendEmail(
  req: Request,
  message: EmailMessage
): Promise<EmailResult[]> {
  const { EMAILER_URL } = Service.getInstance().envConfig.getValues();
  if (!EMAILER_URL) {
    throw new ServiceError('EMAILER_URL is not configured', 500);
  }

  const postData = {
    templateName: message.document,
    recordId: message.tenantId,
    params: {
      term: message.term
    }
  };

  try {
    // TODO: rework types when emailer service will be migrated to typescript
    const response: AxiosResponse<EmailerResponseItem[]> = await axios.post(
      EMAILER_URL,
      postData,
      {
        headers: {
          authorization: req.headers.authorization,
          'Accept-Language': req.headers['accept-language']
        }
      }
    );

    logger.debug('email sent');

    return response.data.map(
      ({ templateName, recordId, params, email, status }): EmailResult => ({
        document: templateName,
        tenantId: recordId,
        term: params.term,
        email,
        status
      })
    );
  } catch (error) {
    logger.error(formatError(error));
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export const send: Middlewares.AsyncRequestHandler<
  API.Landlord.Email.PostSendEmail.RequestParams,
  API.Landlord.Email.PostSendEmail.ResponseBody,
  API.Landlord.Email.PostSendEmail.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }

  const { document, tenantIds, terms, year, month } = req.body;
  const defaultTerm = moment(`${year}/${month}/01`, 'YYYY/MM/DD').format(
    'YYYYMMDDHH'
  );

  const tenants = await Collections.Tenant.find({
    _id: { $in: tenantIds },
    realmId: realm._id
  }).lean();

  const statusList = await Promise.all(
    tenants.map(async (tenant, index) => {
      const tenantId = String(tenant._id);
      const term = Number(terms?.[index] || defaultTerm);

      try {
        const status = await _sendEmail(req, {
          name: tenant.name,
          tenantId,
          document,
          term
        });
        return {
          name: tenant.name,
          tenantId,
          document,
          term,
          ...status
        };
      } catch (error) {
        logger.error(formatError(error));
        return {
          name: tenant.name,
          tenantId,
          document,
          term,
          error:
            axios.isAxiosError(error) && error.response?.data
              ? error.response.data
              : {
                  status: 500,
                  message: `Something went wrong when sending the email to ${tenant.name}`
                }
        };
      }
    })
  );

  if (statusList.some((status) => !!status.error)) {
    throw new ServiceError('Failed to send some emails', 500);
  }

  res.json(statusList);
};
