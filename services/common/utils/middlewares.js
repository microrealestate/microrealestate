const jwt = require('jsonwebtoken');
const logger = require('winston');
const Realm = require('../models/realm');

const needAccessToken = (accessTokenSecret) => {
  return (req, res, next) => {
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
      const decoded = jwt.verify(accessToken, accessTokenSecret);
      if (!decoded.account) {
        logger.warn('accessToken is invalid');
        return res.sendStatus(401);
      }
      req.user = decoded.account;
    } catch (error) {
      logger.warn(error);
      return res.sendStatus(401);
    }

    next();
  };
};

const checkOrganization = () => {
  return async (req, res, next) => {
    // skip organization checks when request comes from tenantapi with sessionToken cookie
    if (!req.headers.authorization && req.cookies.sessionToken) {
      return next();
    }

    // for the currennt user, add all subscribed organizations in request object
    req.realms = (
      await Realm.find({ members: { $elemMatch: { email: req.user.email } } })
    ).map((realm) => {
      const r = realm.toObject();
      r._id = r._id.toString();
      return r;
    });

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
    req.realm = (await Realm.findOne({ _id: organizationId }))?.toObject();
    if (req.realm) {
      req.realm._id = req.realm._id?.toString();
    } else {
      // send 404 if req.realm is not set
      logger.warn('impossible to set organizationId in request');
      return res.sendStatus(404);
    }

    // current user is not a member of the organization
    if (!req.realms.find(({ _id }) => _id === req.realm._id)) {
      logger.warn('current user is not a member of the organization');
      return res.sendStatus(404);
    }

    next();
  };
};

module.exports = {
  needAccessToken,
  checkOrganization,
};
