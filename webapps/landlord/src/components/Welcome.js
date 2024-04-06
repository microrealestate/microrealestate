import { cn } from '../utils';
import { StoreContext } from '../store';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function Welcome({ className }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  return (
    <div
      className={cn(
        'text-secondary-foreground text-center md:text-left',
        className
      )}
    >
      <div className="text-2xl">
        {t('Welcome {{firstName}} {{lastName}}!', {
          firstName: store.user.firstName,
          lastName: store.user.lastName
        })}
      </div>
    </div>
  );
}
