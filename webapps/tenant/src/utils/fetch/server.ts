import axios from 'axios';
import { cookies } from 'next/headers';
import getServerEnv from '../env/server';

const withCredentials = getServerEnv('CORS_ENABLED') === 'true';
const baseURL = getServerEnv('DOCKER_GATEWAY_URL') || getServerEnv('GATEWAY_URL') || 'http://localhost';

export default function getApiFetcher() {
  const sessionToken = cookies().get('sessionToken')?.value;
  const apiFetcher = axios.create({
    baseURL,
    withCredentials,

    headers: {
      Cookie: `sessionToken=${sessionToken}`,
    },
  });
  return apiFetcher;
}
