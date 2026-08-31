'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <LuTriangleAlert className="size-16 text-destructive" />
      <h1 className="text-3xl font-semibold">{t('Something went wrong')}</h1>
      <Button onClick={() => reset()}>{t('Try again')}</Button>
    </div>
  );
}
