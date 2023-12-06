import axios from 'axios';
import config from '../../config';
import { cookies } from 'next/headers';

const withCredentials = config.CORS_ENABLED;
const baseURL = config.DOCKER_GATEWAY_URL || config.GATEWAY_URL;

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
