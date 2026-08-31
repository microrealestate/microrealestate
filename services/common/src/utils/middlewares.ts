import type { CallerType } from '@microrealestate/shared';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ParamsDictionary, Query } from 'express-serve-static-core';
import * as JWT from 'jsonwebtoken';
import Realm from '../collections/realm';
import logger, { formatError } from './logger';
import type {
  LandlordServicePrincipal,
  RealmInRequestType,
  TenantServicePrincipal
} from './service';
import ServiceError from './serviceerror';

const skipPaths = ['/health'];

export type AsyncRequestHandler<
  ReqParams = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query
> = (
  req: Request<ReqParams, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next?: NextFunction
) => Promise<void>;

export function asyncWrapper<
  ReqParams = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query
>(
  cb: AsyncRequestHandler<ReqParams, ResBody, ReqBody, ReqQuery>
): RequestHandler<ReqParams, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => cb(req, res, next).catch(next);
}

type ErrorBodyType = {
  status: number;
  message: string;
  stack?: string;
};

export function errorHandler(
  error: ServiceError | Error,
  _req: Express.Request,
  res: Response<ErrorBodyType>,
  _next: NextFunction
) {
  const responseBody: ErrorBodyType = {
    status: error instanceof ServiceError ? error.statusCode || 500 : 500,
    message: error.message
  };

  if (process.env.NODE_ENV !== 'production') {
    responseBody.stack = error.stack;
  }

  if (responseBody.status >= 500) {
    logger.error(formatError(error));
  } else {
    logger.warn(responseBody.message);
  }
  res.status(responseBody.status).json(responseBody);
}

export function needAccessToken(accessTokenSecret: string | undefined) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (skipPaths.includes(request.path)) {
      return next();
    }

    if (!accessTokenSecret) {
      logger.error('accessTokenSecret not set');
      return response.sendStatus(401);
    }

    let accessToken: string | undefined;
    // landlord api sends accessToken in the authorization header
    if (request.headers.authorization) {
      accessToken = request.headers.authorization.split(' ')[1];
    }

    // tenant api sends accessToken in the sessionToken cookie
    if (
      !request.headers.authorization &&
      request.cookies &&
      request.cookies.sessionToken
    ) {
      accessToken = request.cookies.sessionToken;
    }

    if (!accessToken) {
      logger.warn('accessToken not passed in the request');
      return response.sendStatus(401);
    }

    try {
      const decoded = JWT.verify(
        accessToken,
        accessTokenSecret
      ) as JWT.JwtPayload;
      switch (decoded.type) {
        case 'landlord': {
          const user: LandlordServicePrincipal = {
            type: 'landlord',
            email: decoded.account.email
          };
          request.user = user;
          break;
        }
        case 'tenant': {
          const user: TenantServicePrincipal = {
            type: 'tenant',
            email: decoded.tenant.email
          };
          request.user = user;
          break;
        }
        default:
          logger.warn('accessToken has no valid type claim');
          return response.sendStatus(401);
      }
    } catch (error) {
      logger.warn(String(error));
      return response.sendStatus(401);
    }

    next();
  };
}

export function checkOrganization() {
  return async (request: Request, response: Response, next: NextFunction) => {
    if (skipPaths.includes(request.path)) {
      return next();
    }

    if (!request.user?.type) {
      logger.warn('user not set in request');
      return response.sendStatus(401);
    }

    // tenants belong to no organization.
    if (request.user.type === 'tenant') {
      return next();
    }

    // Only landlords reach here. Checked explicitly rather than assumed: mongoose
    // strips undefined from queries, so a caller type that slipped through with no
    // email would turn the $or below into `[{}, {}]` and match any realm.
    if (request.user.type !== 'landlord') {
      logger.error(
        'checkOrganization: Invalid request received: unknown caller type'
      );
      return response.sendStatus(500);
    }

    const realm = await Realm.findOne({
      $or: [
        { 'member1.email': request.user.email },
        { 'member2.email': request.user.email }
      ]
    }).lean();
    request.realm = realm
      ? ({ ...realm, _id: String(realm._id) } as RealmInRequestType)
      : undefined;

    // POST /realms creates the organization, so it necessarily runs before the
    // caller belongs to one; GET /realms returns null when there is none.
    // Matched exactly on purpose: PATCH /realms/:id must stay subject to the 404,
    // since updating an organization requires one to exist.
    if (request.path === '/realms') {
      return next();
    }

    if (!request.realm) {
      logger.error('current user is not a member of any organization');
      return response.sendStatus(404);
    }

    next();
  };
}

export function onlyCallers(types: [CallerType, ...CallerType[]]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (skipPaths.includes(request.path)) {
      return next();
    }

    if (!request.user?.type) {
      logger.warn('user not set in request');
      return response.sendStatus(401);
    }

    if (!types.includes(request.user.type)) {
      logger.warn('user does not have required type');
      return response.sendStatus(403);
    }

    next();
  };
}

export function needCallerEmail() {
  return (request: Request, response: Response, next: NextFunction) => {
    if (skipPaths.includes(request.path)) {
      return next();
    }

    const user = request.user;
    if (
      !user ||
      (user.type !== 'landlord' && user.type !== 'tenant') ||
      !user.email
    ) {
      logger.warn('caller email not set in request');
      return response.sendStatus(401);
    }

    next();
  };
}

export function getCallerEmail(request: Request): string {
  return (request.user as LandlordServicePrincipal | TenantServicePrincipal)
    .email;
}
