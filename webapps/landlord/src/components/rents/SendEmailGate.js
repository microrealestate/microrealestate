import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { useTranslations } from 'next-intl';
import { useStore } from '@/providers/StoreProvider';

/**
 * Tells whether the organization has an email delivery service. Without one,
 * nothing can be selected to be sent, so the selection checkboxes are not
 * rendered at all.
 */
export function useCanSendEmails() {
  const store = useStore();
  return !!store.organization.canSendEmails;
}

/**
 * Tells why sending documents by email is not possible, null when it is.
 * Pass a rent to also check the tenant has a contact email.
 */
export function useSendEmailDisabledReason(rent) {
  const t = useTranslations('common');
  const store = useStore();

  if (!store.organization.canSendEmails) {
    return t('No mail service configured');
  }

  if (rent && !rent.occupant.hasContactEmails) {
    return t('No emails available for this tenant');
  }

  return null;
}

/**
 * Wraps a control which is disabled for one of the reasons above, so the
 * reason stays discoverable. Disabled controls swallow pointer events, hence
 * the span holding the popover trigger.
 */
export function SendEmailPopover({ reason, children }) {
  if (!reason) {
    return children;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="inline-flex">{children}</span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="w-auto max-w-[min(20rem,calc(100vw-2rem))] p-3 text-sm"
      >
        {reason}
      </PopoverContent>
    </Popover>
  );
}
