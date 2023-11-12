import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import config from '@/config';

export function MainNav({ appName }: { appName: string }) {
  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-2">
        <div className="h-6 w-6 relative">
          <Image
            src={`${config.BASE_PATH}/favicon.svg`}
            alt={appName}
            fill={true}
          />
        </div>
        <span className="inline-block font-bold">{appName}</span>
      </Link>
    </div>
  );
}
