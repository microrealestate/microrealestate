const jwt = require('jsonwebtoken');
const logger = require('winston');
const Realm = require('../model/realm');

const needAccessToken = (accessTokenSecret) => {
  return (req, res, next) => {
    if (!req.headers.authorization) {
      logger.warn('accessToken not passed in the request');
      return res.sendStatus(401);
    }

    const accessToken = req.headers.authorization.split(' ')[1];
    if (!accessToken) {
      logger.warn('accessToken not passed in the request');
      logger.debug(req.headers.authorization);
      return res.sendStatus(401);
    }

    try {
      const decoded = jwt.verify(accessToken, accessTokenSecret);
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
    const organizationId = req.headers.organizationid;
    if (!organizationId) {
      return res.sendStatus(404);
    }

    req.realm = (await Realm.findOne({ _id: organizationId }))?.toObject();
    if (req.realm) {
      req.realm._id = req.realm._id?.toString();
    }
    next();
  };
};

module.exports = {
  needAccessToken,
  checkOrganization,
};
