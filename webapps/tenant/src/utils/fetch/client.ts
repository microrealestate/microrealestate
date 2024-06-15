'use client';
import axios, { AxiosInstance } from 'axios';
import getEnv from '../env/client';

const withCredentials = getEnv('CORS_ENABLED') === 'true';
const baseURL = getEnv('GATEWAY_URL') || 'http://localhost';

let apiFetcher: AxiosInstance;

export default function useApiFetcher() {
  if (apiFetcher) {
    return apiFetcher;
  }

  apiFetcher = axios.create({
    baseURL,
    withCredentials
  });
  apiFetcher.interceptors.response.use(
    (response) => response,
    (error) => {
      // Force signin if an api responded 401 or 403
      if ([401, 403].includes(error.response?.status)) {
        window.location.href = `${getEnv('BASE_PATH') || ''}/signin`;
        throw new axios.Cancel('Operation canceled force login');
      }
      return Promise.reject(error);
    }
  );
  return apiFetcher;
}
