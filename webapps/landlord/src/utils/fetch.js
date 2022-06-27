import { isClient, isServer } from './index';

import axios from 'axios';
import FileDownload from 'js-file-download';
import getConfig from 'next/config';
import { getStoreInstance } from '../store';

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig();
let apiFetch;
let authApiFetch;
const withCredentials = publicRuntimeConfig.CORS_ENABLED;

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
    // create axios instance
    if (isServer()) {
      apiFetch = axios.create({
        baseURL: serverRuntimeConfig.API_URL,
        withCredentials,
      });
    } else {
      apiFetch = axios.create({
        baseURL: publicRuntimeConfig.API_URL,
        withCredentials,
      });
    }

    // manage refresh token on 401
    let isRefreshingToken = false;
    let requestQueue = []; // used when parallel requests
    apiFetch.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        const isLoginRequest =
          originalRequest?.url === '/authenticator/signin' &&
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
            window.location.assign(`${publicRuntimeConfig.BASE_PATH}`);
          }
          throw new axios.Cancel('Operation canceled force login');
        }
        return Promise.reject(error);
      }
    );

    // For logging purposes
    apiFetch.interceptors.response.use(
      (response) => {
        if (
          response?.config?.method &&
          response?.config?.url &&
          response?.status
        ) {
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
        } else {
          console.error(error);
        }
        return Promise.reject(error);
      }
    );
  }
  return apiFetch;
};

export const authApiFetcher = (cookie) => {
  if (isClient()) {
    return;
  }

  const { serverRuntimeConfig } = getConfig();
  const axiosConfig = {
    baseURL: serverRuntimeConfig.API_URL,
    withCredentials,
  };
  if (cookie) {
    axiosConfig.headers = { cookie };
  }
  authApiFetch = axios.create(axiosConfig);
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
        withCredentials: error.response?.config?.withCredentials,
      },
    },
  };
};

export const downloadDocument = async ({ endpoint, documentName }) => {
  const response = await apiFetcher().get(endpoint, {
    responseType: 'blob',
  });
  FileDownload(response.data, documentName);
};

export const uploadDocument = async ({
  endpoint,
  documentName,
  file,
  folder,
}) => {
  const formData = new FormData();
  if (folder) {
    formData.append('folder', folder);
  }
  formData.append('fileName', documentName);
  formData.append('file', file);
  return await apiFetcher().post(endpoint, formData, {
    headers: {
      timeout: 60000,
      'Content-Type': 'multipart/form-data',
    },
  });
};
