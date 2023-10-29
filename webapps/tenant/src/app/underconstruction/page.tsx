'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import config from '@/config';
import Image from 'next/image';

export default function UnderConstruction() {
  const handleClick = () => {
    window.location.href = `${config.BASE_PATH}/en/signin`;
  };

  return (
    <div className={cn('flex flex-col align-items justify-content')}>
      <Image
        src={`${config.BASE_PATH}/undraw_qa_engineers_dg-5-p.svg`}
        alt="Logo"
        width={400}
        height={400}
      />
      <h1 className={cn('text-2xl text-center')}>Work in progress</h1>
      <Button className={cn('mt-16')} onClick={handleClick}>
        View site with mock data
      </Button>
    </div>
  );
}
