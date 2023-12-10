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

export type ServiceRequest = Express.Request & {
  user?: CollectionTypes.Account;
  application?: CollectionTypes.ApplicationCredentials;
  role: string;
  realm?: CollectionTypes.Realm | null;
  realms: CollectionTypes.Realm[];
};
