'use client';
import axios from 'axios';
import getEnv from '../env/client';

const withCredentials = getEnv('CORS_ENABLED') === 'true';
const baseURL = getEnv('GATEWAY_URL') || 'http://localhost';

export default function useApiFetcher() {
  const apiFetcher = axios.create({
    baseURL,
    withCredentials,
  });
  return apiFetcher;
}
