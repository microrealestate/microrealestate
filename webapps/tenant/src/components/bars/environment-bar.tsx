import config from '@/config';
import getTranslation from '@/utils/i18n/server/getTranslation';

export async function EnvironmentBar() {
  const { t } = await getTranslation();

  return config.DEMO_MODE || config.NODE_ENV === 'development' ? (
    <div className={config.DEMO_MODE ? 'bg-green-600' : 'bg-slate-300'}>
      <div
        className={`container h-6 flex items-center justify-center text-sm ${
          config.DEMO_MODE ? 'text-white' : 'text-gray-800'
        } tracking-wider`}
      >
        {config.DEMO_MODE ? t('Demonstration mode') : t('Development mode')}
      </div>
    </div>
  ) : null;
}
