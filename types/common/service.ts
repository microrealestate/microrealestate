import type * as Express from 'express';
import { CollectionTypes } from './collections.js';

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

export type ServiceResponse = Express.Response;

export type UserServicePrincipal = {
  type: 'user';
  email: string;
  role?: string;
};
export type ApplicationServicePrincipal = {
  type: 'application';
  clientId: string;
  role?: string;
};
export type ServicePrincipal =
  | UserServicePrincipal
  | ApplicationServicePrincipal;

export type ServiceRequest = Express.Request & {
  user: ServicePrincipal;
  realm?: CollectionTypes.Realm | null;
  realms: CollectionTypes.Realm[];
};
