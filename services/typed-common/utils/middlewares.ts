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
      if (decoded.account) {
        (req as ServiceRequest).user = decoded.account;
      } else if (decoded.application) {
        (req as ServiceRequest).application = decoded.application;
      } else {
        logger.warn('accessToken is invalid');
        return res.sendStatus(401);
      }
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

    if (req.user) {
      // for the current user, add all subscribed organizations in request object
      req.realms = (
        await Realm.find<MongooseDocument<CollectionTypes.Realm>>({
          members: { $elemMatch: { email: req.user.email } },
        })
      ).map((realm) => realm.toObject());
    } else if (req.application) {
      // for the current application access, add only the associated realm
      let realm = (
        await Realm.findOne<MongooseDocument<CollectionTypes.Realm>>({
          applications: { $elemMatch: { clientId: req.application.clientId } },
        })
      )?.toObject();
      if (realm) {
        req.realms = [realm];
      }
    } else {
      logger.error(
        'checkOrganization: Invalid request received: neither user nor application'
      );
      return res.sendStatus(500);
    }

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

    // resolve the role for the current realm
    if (req.user) {
      const currentMember = req.realm.members.find(
        ({ email }) => email === (req as ServiceRequest).user?.email
      );
      if (currentMember?.role) {
        req.role = currentMember.role;
      }
    } else if (req.application) {
      const currentApp = req.realm.applications.find(
        ({ clientId }) =>
          clientId === (req as ServiceRequest).application?.clientId
      );
      if (currentApp?.role) {
        req.role = currentApp.role;
      }
    }
    if (!req.role) {
      logger.warn('current user could no be found within realm');
      return res.sendStatus(404);
    }

    next();
  };
}
