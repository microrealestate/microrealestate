import type * as Express from 'express';
import type * as ExpressCore from 'express-serve-static-core';
import { CollectionTypes } from './collections.js';
import { ConnectionRole } from './index.js';

export type ServiceOptions = {
  name: string;
  useMongo?: boolean;
  useRedis?: boolean;
  useAxios?: boolean;
  useRequestParsers?: boolean;
  onStartUp?: (express: Express.Application) => Promise<void>;
  onShutDown?: () => Promise<void>;
};

export type ResponseError = {
  error: string;
  results?: undefined;
};

export type ServiceResponse<
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>
> = Express.Response<ResBody, Locals>;

export type UserServicePrincipal = {
  type: 'user';
  email: string;
  role?: ConnectionRole;
};
export type ApplicationServicePrincipal = {
  type: 'application';
  clientId: string;
  role?: ConnectionRole;
};

export type InternalServicePrincipal = {
  type: 'service';
  serviceId: string;
  realmId: string;
  role?: ConnectionRole;
};

export type ServicePrincipal =
  | UserServicePrincipal
  | ApplicationServicePrincipal
  | InternalServicePrincipal;

export type ServiceRequest<
  P = ExpressCore.ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ExpressCore.Query,
  Locals extends Record<string, unknown> = Record<string, unknown>
> = Express.Request<P, ResBody, ReqBody, ReqQuery, Locals> & {
  user: ServicePrincipal;
  realm?: CollectionTypes.Realm | null;
  realms: CollectionTypes.Realm[];
};
