import getServerEnv from '@/utils/env/server';
import getTranslation from '@/utils/i18n/server/getTranslation';

export async function EnvironmentBar() {
  const { t } = await getTranslation();

  return getServerEnv('DEMO_MODE') === 'true' || getServerEnv('NODE_ENV') === 'development' ? (
    <div className={getServerEnv('DEMO_MODE') === 'true' ? 'bg-success' : 'bg-neutral-500'}>
      <div
        className={
          'container h-6 flex items-center justify-center text-sm text-success-foreground tracking-wider'
        }
      >
        {getServerEnv('DEMO_MODE') === 'true' ? t('Demonstration mode') : t('Development mode')}
      </div>
    </div>
  ) : null;
}
