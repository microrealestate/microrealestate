'use client';

import { env } from 'next-runtime-env';


export default function getEnv(key: string) {
  return env(`NEXT_PUBLIC_${key}`);
}
