import * as axios from 'axios';
import logger, { formatError } from './logger';

export default function httpInterceptors() {
  // For logging purposes
  axios.default.interceptors.request.use(
    (config) => {
      if (config?.method && config?.url) {
        logger.info(`${config.method.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error) => {
      logger.error(formatError(error));
      return Promise.reject(error);
    }
  );

  axios.default.interceptors.response.use(
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
          }`,
          error
        );
      } else {
        logger.error(formatError(error));
      }
      return Promise.reject(error);
    }
  );
}
