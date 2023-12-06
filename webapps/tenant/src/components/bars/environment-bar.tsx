import config from '@/config';
import getTranslation from '@/utils/i18n/server/getTranslation';

export async function EnvironmentBar() {
  const { t } = await getTranslation();

  return config.DEMO_MODE || config.NODE_ENV === 'development' ? (
    <div className={config.DEMO_MODE ? 'bg-success' : 'bg-neutral-500'}>
      <div
        className={
          'container h-6 flex items-center justify-center text-sm text-success-foreground tracking-wider'
        }
      >
        {config.DEMO_MODE ? t('Demonstration mode') : t('Development mode')}
      </div>
    </div>
  ) : null;
}
