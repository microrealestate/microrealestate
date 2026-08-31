import {
  transformRequestDates,
  transformResponseDates
} from '@microrealestate/shared';
import axios, { type AxiosInstance } from 'axios';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BASE_PATH } from '@/utils/basepath';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8080';

async function createFetcher(baseURL: string): Promise<AxiosInstance> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('sessionToken')?.value || '';
  const apiFetcher = axios.create({
    baseURL,
    timeout: 10_000,
    transformResponse: [transformResponseDates],
    headers: sessionToken ? { Cookie: `sessionToken=${sessionToken}` } : {}
  });

  apiFetcher.interceptors.request.use((config) => {
    if (
      config.data &&
      typeof config.data === 'object' &&
      !(config.data instanceof FormData)
    ) {
      config.data = transformRequestDates(config.data);
    }
    return config;
  });

  apiFetcher.interceptors.response.use(
    (response) => response,
    (error) => {
      if ([401, 403].includes(error.response?.status)) {
        redirect(`${BASE_PATH}/signin`);
      }
      return Promise.reject(error);
    }
  );
  return apiFetcher;
}

export async function getTenantApiFetcher() {
  return createFetcher(`${GATEWAY_URL}/tenantapi`);
}
