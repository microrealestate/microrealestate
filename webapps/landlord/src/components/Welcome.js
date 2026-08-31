import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { useStore } from '@/providers/StoreProvider';

export default function Welcome({ className }) {
  const store = useStore();
  const t = useTranslations('common');
  return (
    <div
      className={cn(
        'text-secondary-foreground text-center md:text-left',
        className
      )}
    >
      <div className="text-2xl">
        {t('Welcome {firstName} {lastName}!', {
          firstName: store.user.firstName,
          lastName: store.user.lastName
        })}
      </div>
    </div>
  );
}
