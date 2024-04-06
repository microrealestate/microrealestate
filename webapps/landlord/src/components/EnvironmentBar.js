import { cn } from '../utils';
import config from '../config';
import useTranslation from 'next-translate/useTranslation';

export default function EnvironmentBar({ className }) {
  const { t } = useTranslation('common');
  return config.DEMO_MODE || config.NODE_ENV === 'development' ? (
    <div
      className={cn(
        'text-xs text-center py-0.5',
        config.DEMO_MODE
          ? 'bg-success text-success-foreground'
          : 'bg-neutral-500 text-success-foreground/80',
        className
      )}
    >
      {config.DEMO_MODE ? t('Demonstration mode') : t('Development mode')}
    </div>
  ) : null;
}
