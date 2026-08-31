import {
  transformRequestDates,
  transformResponseDates
} from '@microrealestate/shared';
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig
} from 'axios';
import { BASE_PATH } from './basepath';

const BASE_URL = '/api/v2';

export const apiClient: AxiosInstance = axios.create({
  transformResponse: [transformResponseDates]
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Processes the failed requests queue by resolving or rejecting them.
 * @param error The error to reject the queue with (if refresh failed).
 * @param token The new access token to resolve the queue with (if refresh succeeded).
 */
function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
}

apiClient.interceptors.request.use((config) => {
  config.baseURL = BASE_URL;
  if (
    config.data &&
    typeof config.data === 'object' &&
    !(config.data instanceof FormData)
  ) {
    config.data = transformRequestDates(config.data);
  }
  return config;
});

/**
 * Determines if a token refresh should be attempted based on the error response.
 * @param error The Axios error received.
 * @param originalRequest The original request configuration.
 * @returns True if the error is 401 and it's not a login or refresh request.
 */
function shouldRefreshToken(
  error: AxiosError,
  originalRequest: InternalAxiosRequestConfig & { _retry?: boolean }
) {
  const isLoginRequest =
    originalRequest?.url === '/authenticator/landlord/signin' &&
    originalRequest?.method === 'post';

  const isRefreshRequest =
    originalRequest?.url === '/authenticator/landlord/refreshtoken' &&
    originalRequest?.method === 'post';

  return (
    error.response?.status === 401 &&
    !isLoginRequest &&
    !isRefreshRequest &&
    !originalRequest._retry
  );
}

/**
 * Queues the request and waits for a new token before retrying.
 * @param originalRequest The original request configuration.
 * @returns A promise that resolves to the retried request.
 */
async function waitAndRetryRequest(
  originalRequest: InternalAxiosRequestConfig
) {
  const accessToken = await new Promise<string>((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
  originalRequest.headers.Authorization = `Bearer ${accessToken}`;
  return apiClient(originalRequest);
}

/**
 * Performs the token refresh and retries the original request.
 * @param originalRequest The original request configuration.
 * @returns A promise that resolves to the retried request.
 */
async function handleTokenRefresh(
  originalRequest: InternalAxiosRequestConfig & { _retry?: boolean }
) {
  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const response = await apiClient.post(
      '/authenticator/landlord/refreshtoken'
    );

    if (!response?.data?.accessToken) {
      throw new Error('Refresh token response missing accessToken');
    }

    const { accessToken } = response.data;
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

    processQueue(null, accessToken);
    isRefreshing = false;

    return apiClient(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    isRefreshing = false;
    return Promise.reject(refreshError);
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (shouldRefreshToken(error, originalRequest)) {
      if (isRefreshing) {
        try {
          return await waitAndRetryRequest(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      return handleTokenRefresh(originalRequest);
    }

    if (error.response?.status === 403) {
      window.location.assign(`${BASE_PATH}/signin`);
    }

    return Promise.reject(error);
  }
);

/**
 * Sets the default Authorization header for all future requests.
 * @param accessToken The new access token (or null to clear it).
 */
export function setAccessToken(accessToken: string | null) {
  if (accessToken) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else if (accessToken === null) {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export default apiClient;
