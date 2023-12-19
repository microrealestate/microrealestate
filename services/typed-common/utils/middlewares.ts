import * as Express from 'express';
import * as JWT from 'jsonwebtoken';
import {
  CollectionTypes,
  MongooseDocument,
  ServiceRequest,
  ServiceResponse,
} from '@microrealestate/types';
import logger from 'winston';
import Realm from '../collections/realm.js';

export function needAccessToken(
  accessTokenSecret: string | undefined
): (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => void {
  return (
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction
  ) => {
    if (!accessTokenSecret) {
      logger.error('accessTokenSecret not set');
      return res.sendStatus(401);
    }

    let accessToken;
    // landlord api sends accessToken in the authorization header
    if (req.headers.authorization) {
      accessToken = req.headers.authorization.split(' ')[1];
    }

    // tenant api sends accessToken in the sessionToken cookie
    if (!req.headers.authorization && req.cookies && req.cookies.sessionToken) {
      accessToken = req.cookies.sessionToken;
    }

    if (!accessToken) {
      logger.warn('accessToken not passed in the request');
      return res.sendStatus(401);
    }

    try {
      const decoded = JWT.verify(
        accessToken,
        accessTokenSecret
      ) as JWT.JwtPayload;
      if (!decoded.account) {
        logger.warn('accessToken is invalid');
        return res.sendStatus(401);
      }
      (req as ServiceRequest).user = decoded.account;
    } catch (error) {
      logger.warn(String(error));
      return res.sendStatus(401);
    }

    next();
  };
}

export function checkOrganization() {
  return async (
    req: ServiceRequest,
    res: ServiceResponse,
    next: Express.NextFunction
  ) => {
    // skip organization checks when request comes from tenantapi with sessionToken cookie
    if (!req.headers.authorization && req.cookies.sessionToken) {
      return next();
    }

    // for the currennt user, add all subscribed organizations in request object
    req.realms = (
      await Realm.find<MongooseDocument<CollectionTypes.Realm>>({
        members: { $elemMatch: { email: req.user.email } },
      })
    ).map((realm) => realm.toObject());

    // skip organization checks when fetching them
    if (req.path === '/realms') {
      return next();
    }

    // For other requests

    // check if organizationid header exists
    const organizationId = req.headers.organizationid;
    if (!organizationId) {
      logger.warn('organizationId not passed in request');
      return res.sendStatus(404);
    }

    // add organization in request object
    req.realm = (
      await Realm.findOne<MongooseDocument<CollectionTypes.Realm>>({
        _id: organizationId,
      })
    )?.toObject();
    if (!req.realm) {
      // send 404 if req.realm is not set
      logger.warn('impossible to set organizationId in request');
      return res.sendStatus(404);
    }

    // current user is not a member of the organization
    if (!req.realms.find(({ _id }) => _id === req.realm?._id)) {
      logger.warn('current user is not a member of the organization');
      return res.sendStatus(404);
    }

    next();
  };
}
