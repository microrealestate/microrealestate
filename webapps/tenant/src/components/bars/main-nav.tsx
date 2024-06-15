import * as React from 'react';
import Link from 'next/link';

export function MainNav({ appName }: { appName: string }) {
  return (
    <Link href="/">
      <div className="sm:text-xl">{appName}</div>
    </Link>
  );
}
