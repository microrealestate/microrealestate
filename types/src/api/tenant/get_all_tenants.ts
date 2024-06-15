import { ResponseError, ServiceRequest, ServiceResponse } from '../../index.js';
import { TenantDataType } from './types.js';

export type Request = ServiceRequest & {
  email?: string;
};

export type Response = ServiceResponse &
  (
    | {
        error?: undefined;
        results: TenantDataType[] | [];
      }
    | ResponseError
  );
