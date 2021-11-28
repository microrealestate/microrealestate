const axios = require('axios');
const logger = require('winston');

module.exports = () => {
  // For logging purposes
  axios.interceptors.request.use(
    (config) => {
      if (config?.method && config?.url) {
        logger.info(`${config.method.toUpperCase()} ${config.url}`);
      }
      logger.info(config.headers);
      return config;
    },
    (error) => {
      logger.error(error?.message || error);
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => {
      if (
        response?.config?.method &&
        response?.config?.url &&
        response?.status
      ) {
        logger.info(
          `${response.config.method.toUpperCase()} ${response.config.url} ${
            response.status
          }`
        );
      }
      return response;
    },
    (error) => {
      if (
        error?.config?.method &&
        error?.response?.url &&
        error?.response?.status
      ) {
        logger.error(
          `${error.config.method.toUpperCase()} ${error.config.url} ${
            error.response.status
          }`
        );
      } else {
        logger.error(error?.message || error);
      }
      return Promise.reject(error);
    }
  );
};
