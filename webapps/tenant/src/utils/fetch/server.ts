import axios from 'axios';
import { cookies } from 'next/headers';
import getServerEnv from '../env/server';
import { redirect } from 'next/navigation';

const withCredentials = getServerEnv('CORS_ENABLED') === 'true';
const baseURL =
  getServerEnv('DOCKER_GATEWAY_URL') ||
  getServerEnv('GATEWAY_URL') ||
  'http://localhost';

export default function getApiFetcher() {
  const sessionToken = cookies().get('sessionToken')?.value;
  const apiFetcher = axios.create({
    baseURL,
    withCredentials,

    headers: {
      Cookie: `sessionToken=${sessionToken}`
    }
  });

  apiFetcher.interceptors.response.use(
    (response) => response,
    (error) => {
      // Force signin if an api responded 401 or 403
      if ([401, 403].includes(error.response?.status)) {
        redirect(`${getServerEnv('BASE_PATH') || ''}/signin`);
        throw new axios.Cancel('Operation canceled force login');
      }
      return Promise.reject(error);
    }
  );
  return apiFetcher;
}
