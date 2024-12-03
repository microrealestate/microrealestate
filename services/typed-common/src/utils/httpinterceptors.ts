import * as axios from 'axios';
import logger from 'winston';

export default function httpInterceptors() {
  // For logging purposes
  axios.default.interceptors.request.use(
    (config) => {
      if (config?.method && config?.url) {
        logger.info(`${config.method.toUpperCase()} ${config.url}`);
      }

      // log config headers
      if (config?.headers) {
        logger.debug('Headers:');
        Object.entries(config.headers)
          .sort(([key1], [key2]) => key1.localeCompare(key2))
          .reduce(
            (acc, [key, value]) => [...acc, `${key}: ${JSON.stringify(value)}`],
            [] as string[]
          )
          .forEach((configLine) => logger.debug(configLine));
      }
      return config;
    },
    (error) => {
      logger.error(error?.message || error);
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
          }`
        );
      } else {
        logger.error(error?.message || error);
      }
      return Promise.reject(error);
    }
  );
}
