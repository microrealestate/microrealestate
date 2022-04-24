import { isClient, isServer } from './index';

import axios from 'axios';
import FileDownload from 'js-file-download';
import getConfig from 'next/config';
import { getStoreInstance } from '../store';
import { Mutex } from 'async-mutex';

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

    // add client interceptors
    if (isClient()) {
      const refreshTokensAndUpdateConfig = async (store, config) => {
        await store.user.refreshTokens();
        if (store.user.signedIn) {
          config.headers['Authorization'] =
            apiFetch.defaults.headers.common['Authorization'];
        }
      };
      // use mutex to avoid race condition when several requests are done in parallel
      const RTMutex = new Mutex();

      // force refresh token when expiration time is close to 10s
      // this will let the time to propagate a valid RT in all back-end services
      const minRTExpirationDelay = 10000; // 10s
      apiFetch.interceptors.request.use(
        async (config) => {
          const store = getStoreInstance();
          if (
            store.user.signedIn &&
            config.url !== '/authenticator/refreshtoken'
          ) {
            const isRefreshTokenAboutToExpire =
              store.user.tokenExpiry * 1000 - Date.now() <=
              minRTExpirationDelay;

            if (isRefreshTokenAboutToExpire) {
              if (RTMutex.isLocked()) {
                await RTMutex.waitForUnlock();
              } else {
                await RTMutex.runExclusive(async () => {
                  console.log(
                    'accessToken is about to expire, call refresh tokens'
                  );
                  await refreshTokensAndUpdateConfig(store, config);
                });
              }
            }
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Force signin if an api responded 403
      apiFetch.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 403) {
            return window.location.reload();
          }
          return Promise.reject(error);
        }
      );
    }

    // client/server interceptors
    // For debugging purposes
    if (process.env.NODE_ENV === 'development') {
      apiFetch.interceptors.request.use(
        (config) => {
          if (config?.method && config?.url) {
            console.log(`${config.method.toUpperCase()} ${config.url}`);
          }
          console.log(config);
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
    }

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
          // return Promise.reject({ error });
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
  authApiFetch = axios.create({
    baseURL: serverRuntimeConfig.API_URL,
    headers: { cookie },
    withCredentials,
  });

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
