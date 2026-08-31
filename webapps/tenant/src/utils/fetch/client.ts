import {
  transformRequestDates,
  transformResponseDates
} from '@microrealestate/shared';
import axios, { type AxiosInstance } from 'axios';
import { BASE_PATH } from '@/utils/basepath';

const apiClient: AxiosInstance = axios.create({
  timeout: 20_000,
  transformResponse: [transformResponseDates]
});

apiClient.interceptors.request.use((config) => {
  if (
    config.data &&
    typeof config.data === 'object' &&
    !(config.data instanceof FormData)
  ) {
    config.data = transformRequestDates(config.data);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = error.config?.url?.split('?')[0];
    if (!path?.endsWith('/signedin')) {
      if ([401, 403].includes(error.response?.status)) {
        window.location.href = `${BASE_PATH}/signin`;
        throw new axios.Cancel('Operation canceled force login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
