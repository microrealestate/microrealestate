import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import config from '@/config';

export function MainNav({ appName }: { appName: string }) {
  return (
    <Link href="/">
      <div className="flex items-center gap-1">
        <Image
          src={`${config.BASE_PATH}/favicon.svg`}
          alt={appName}
          width={24}
          height={24}
        />
        <div className="font-semibold sm:text-2xl">{appName}</div>
      </div>
    </Link>
  );
}
