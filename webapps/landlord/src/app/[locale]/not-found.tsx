'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import { useTranslations } from 'next-intl';
import { LuFileQuestion } from 'react-icons/lu';
import { BASE_PATH } from '@/utils/basepath';

export default function NotFound() {
  const t = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <LuFileQuestion className="size-16 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">{t('Page not found')}</h1>
        <p className="text-muted-foreground">
          {t('The page you are looking for does not exist')}
        </p>
      </div>
      <Button onClick={() => window.location.assign(BASE_PATH)}>
        {t('Go to the home page')}
      </Button>
    </div>
  );
}
