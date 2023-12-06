import axios from 'axios';
import config from '../../config';

const withCredentials = config.CORS_ENABLED;
const baseURL = config.GATEWAY_URL;

export default function useApiFetcher() {
  const apiFetcher = axios.create({
    baseURL,
    withCredentials,
  });
  return apiFetcher;
}
