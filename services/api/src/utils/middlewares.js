const jwt = require('jsonwebtoken');
const logger = require('winston');
const realmModel = require('../models/realm');

const needAccessToken = (accessTokenSecret) => {
  return (req, res, next) => {
    if (!req.headers.authorization) {
      return res.sendStatus(401);
    }

    const accessToken = req.headers.authorization.split(' ')[1];
    if (!accessToken) {
      return res.sendStatus(401);
    }

    try {
      const decoded = jwt.verify(accessToken, accessTokenSecret);
      req.user = decoded.account;
    } catch (err) {
      logger.warn(err);
      return res.sendStatus(401);
    }

    next();
  };
};

const checkOrganization = () => {
  return (req, res, next) => {
    if (req.path !== '/realms' && !req.headers.organizationid) {
      return res.sendStatus(404);
    }

    realmModel.findByEmail(req.user.email, (err, realms = []) => {
      if (err) {
        return next(err);
      }
      if (realms && realms.length) {
        req.realms = realms;
        const realmId = req.headers.organizationid;
        if (realmId) {
          req.realm = req.realms.find(
            (realm) => realm._id.toString() === realmId
          );
          if (req.path !== '/realms' && !req.realm) {
            return res.sendStatus(404);
          }
        }
      } else {
        delete req.realm;
        req.realms = [];
      }
      next();
    });
  };
};

module.exports = {
  needAccessToken,
  checkOrganization,
};
