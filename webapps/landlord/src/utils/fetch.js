import axios, { Cancel } from 'axios';
import { isClient, isServer } from '@microrealestate/commonui/utils';

import config from '../config';
import FileDownload from 'js-file-download';
import { getStoreInstance } from '../store';

let apiFetch;
let authApiFetch;
const withCredentials = config.CORS_ENABLED;

const axiosResponseHandlers = [
  (response) => {
    if (response?.config?.method && response?.config?.url && response?.status) {
      console.log(
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
      console.error(
        `${error.config.method.toUpperCase()} ${error.config.url} ${
          error.response.status
        }`
      );
    } else if (
      error?.response?.config?.method &&
      error?.response?.config?.url &&
      error?.response?.status &&
      error?.response?.statusText
    ) {
      console.error(
        `${error.response.config.method.toUpperCase()} ${
          error.response.config.url
        } ${error.response.status} ${error.response.statusText}`
      );
    } else {
      console.error(error.message || error);
    }
    return Promise.reject(error);
  }
];

export const setAccessToken = (accessToken) => {
  apiFetcher();
  if (accessToken) {
    apiFetch.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  } else if (accessToken === null) {
    delete apiFetch.defaults.headers.common['Authorization'];
  }
};

export const setOrganizationId = (organizationId) => {
  apiFetcher();
  if (organizationId) {
    apiFetch.defaults.headers.organizationId = organizationId;
  } else if (organizationId === null) {
    delete apiFetch.defaults.headers.organizationId;
  }
};

export const setAcceptLanguage = (acceptLanguage) => {
  apiFetcher();
  if (acceptLanguage) {
    apiFetch.defaults.headers['Accept-Language'] = acceptLanguage;
  }
};

export const apiFetcher = () => {
  if (!apiFetch) {
    // create an axios instance
    const baseURL = `${
      isServer()
        ? config.DOCKER_GATEWAY_URL || config.GATEWAY_URL
        : config.GATEWAY_URL
    }/api/v2`;

    if (isClient()) {
      const webAppUrl = new URL(window.location.href);
      const gatewayUrl = new URL(baseURL);

      if (webAppUrl.origin !== gatewayUrl.origin) {
        console.error(
          `-----------------------------------------------------------------------------------------------------
| 🚨 Important! 🚨                                                                                   |
-----------------------------------------------------------------------------------------------------
Origin mismatch between webapp and api endpoint: ${webAppUrl.origin} vs ${gatewayUrl.origin}
Please restart the server with APP_DOMAIN=${webAppUrl.hostname} and APP_PORT=${webAppUrl.port}.
-----------------------------------------------------------------------------------------------------`
        );
      }
    }
    apiFetch = axios.create({
      baseURL,
      withCredentials
    });

    // manage refresh token on 401
    let isRefreshingToken = false;
    let requestQueue = []; // used when parallel requests
    apiFetch.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        const isLoginRequest =
          originalRequest?.url === '/authenticator/landlord/signin' &&
          originalRequest?.method === 'post';

        // Try to to refresh token once get 401
        if (
          error.response?.status === 401 &&
          !isLoginRequest &&
          !originalRequest._retry
        ) {
          if (isRefreshingToken) {
            // queued incomming request while refresh token is running
            return new Promise(function (resolve, reject) {
              requestQueue.push({ resolve, reject });
            })
              .then(async () => {
                // use latest authorization token
                originalRequest.headers['Authorization'] =
                  apiFetch.defaults.headers.common['Authorization'];

                return apiFetch(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshingToken = true;

          try {
            const store = getStoreInstance();
            await store.user.refreshTokens();

            // run all requests queued
            requestQueue.forEach((request) => {
              request.resolve();
            });

            // use latest authorization token
            originalRequest.headers['Authorization'] =
              apiFetch.defaults.headers.common['Authorization'];

            return apiFetch(originalRequest);
          } finally {
            isRefreshingToken = false;
            requestQueue = [];
          }
        }
        return Promise.reject(error);
      }
    );

    // force signin on 403
    apiFetch.interceptors.response.use(
      (response) => response,
      (error) => {
        // Force signin if an api responded 403
        if (error.response?.status === 403) {
          if (isClient()) {
            window.location.assign(`${config.BASE_PATH}`);
          }
          throw new Cancel('Operation canceled force login');
        }
        return Promise.reject(error);
      }
    );

    // For logging purposes
    apiFetch.interceptors.response.use(...axiosResponseHandlers);
  }
  return apiFetch;
};

export const authApiFetcher = (cookie) => {
  if (isClient()) {
    return;
  }

  const axiosConfig = {
    baseURL: `${config.DOCKER_GATEWAY_URL || config.GATEWAY_URL}/api/v2`,
    withCredentials
  };
  if (cookie) {
    axiosConfig.headers = { cookie };
  }
  authApiFetch = axios.create(axiosConfig);

  // For logging purposes
  authApiFetch.interceptors.response.use(...axiosResponseHandlers);

  return authApiFetch;
};

export const buildFetchError = (error) => {
  return {
    error: {
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      request: {
        url: error.response?.config?.url,
        method: error.response?.config?.method,
        headers: error.response?.config?.headers,
        baseURL: error.response?.config?.baseURL,
        withCredentials: error.response?.config?.withCredentials
      }
    }
  };
};

export const downloadDocument = async ({ endpoint, documentName }) => {
  const response = await apiFetcher().get(endpoint, {
    responseType: 'blob'
  });
  FileDownload(response.data, documentName);
};

export const uploadDocument = async ({
  endpoint,
  documentName,
  file,
  folder
}) => {
  const formData = new FormData();
  if (folder) {
    formData.append('folder', folder);
  }
  formData.append('fileName', documentName);
  formData.append('file', file);
  return await apiFetcher().post(endpoint, formData, {
    headers: {
      timeout: 30000,
      'Content-Type': 'multipart/form-data'
    }
  });
};
