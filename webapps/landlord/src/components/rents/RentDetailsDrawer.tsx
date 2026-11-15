import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LuHistory, LuUser, LuX } from 'react-icons/lu';
import { RiMailSendLine } from 'react-icons/ri';
import { TbCashRegister } from 'react-icons/tb';
import { Link } from '@/i18n/navigation';
import DrawerActionBar from '../DrawerActionBar';
import { useRentPropertySummary } from './RentCells';
import RentEmailsSent from './RentEmailsSent';
import { RentBalanceSummary, RentCharges, RentPayments } from './RentStatement';
import { rentPropertyList } from './rentView';
import { SendEmailPopover, useSendEmailDisabledReason } from './SendEmailGate';
import type { MonthRent } from './types';

function Section({
  title,
  children,
  className
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h3 className="mb-1.5 text-sm font-medium md:mb-2 md:text-xs md:font-semibold md:uppercase md:tracking-wide md:text-muted-foreground">
        {title}
      </h3>
      <div className="rounded-lg border bg-card px-3 py-1.5 md:rounded-none md:border-0 md:bg-transparent md:p-0">
        {children}
      </div>
    </section>
  );
}

function RentDrawerActions({
  rent,
  onPay,
  onSend,
  onHistory
}: {
  rent: MonthRent;
  onPay: (rent: MonthRent) => void;
  onSend: (rent: MonthRent) => void;
  onHistory: (rent: MonthRent) => void;
}) {
  const t = useTranslations('common');
  const sendEmailDisabledReason = useSendEmailDisabledReason(rent);
  return (
    <>
      <SendEmailPopover reason={sendEmailDisabledReason}>
        <Button
          variant="outline"
          className="gap-2"
          disabled={!!sendEmailDisabledReason}
          onClick={() => onSend(rent)}
        >
          <RiMailSendLine className="size-4" />
          <span className="sr-only md:not-sr-only">{t('Send email…')}</span>
        </Button>
      </SendEmailPopover>
      <Button
        variant="outline"
        className="gap-2"
        data-cy="detailsHistoryAction"
        onClick={() => onHistory(rent)}
      >
        <LuHistory className="size-4" />
        <span className="sr-only md:not-sr-only">{t('History')}</span>
      </Button>
      <Button
        className="gap-2"
        data-cy="detailsPayRentAction"
        onClick={() => onPay(rent)}
      >
        <TbCashRegister className="size-4" />
        {t('Record payment')}
      </Button>
    </>
  );
}

export default function RentDetailsDrawer({
  rent,
  periodLabel,
  open,
  onOpenChange,
  onPay,
  onSend,
  onHistory
}: {
  rent: MonthRent | null;
  periodLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPay: (rent: MonthRent) => void;
  onSend: (rent: MonthRent) => void;
  onHistory: (rent: MonthRent) => void;
}) {
  const t = useTranslations('common');
  const propertySummary = useRentPropertySummary();
  const properties = rent ? rentPropertyList(rent) : [];
  const tenantHref = `/tenants/${rent?.occupant._id}`;

  const closeThen =
    (action: (rent: MonthRent) => void) => (actionRent: MonthRent) => {
      onOpenChange(false);
      action(actionRent);
    };

  return (
    <Drawer open={open && !!rent} onOpenChange={onOpenChange}>
      <DrawerContent
        className="mt-0 h-dvh rounded-none md:mt-24 md:h-[70vh] md:rounded-t-[10px]"
        data-cy="rentDetailsDrawer"
      >
        {rent ? (
          <>
            <DrawerHeader className="mx-auto w-full max-w-(--breakpoint-lg) border-b px-4 text-left md:px-8">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <DrawerTitle className="text-xl leading-tight wrap-break-word">
                    {rent.occupant.name}
                  </DrawerTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <DrawerDescription className="wrap-break-word">
                      {t('{property} · {period}', {
                        property: propertySummary(rent),
                        period: periodLabel
                      })}
                    </DrawerDescription>
                    <Link
                      href={tenantHref}
                      className="hidden items-center gap-1 text-sm text-primary underline-offset-4 hover:underline md:inline-flex"
                    >
                      <LuUser className="size-4" />
                      {t('Open tenant file')}
                    </Link>
                  </div>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Link href={tenantHref} aria-label={t('Open tenant file')}>
                    <LuUser className="size-5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label={t('Close')}
                  data-cy="rentDetailsClose"
                  onClick={() => onOpenChange(false)}
                >
                  <LuX className="size-5" />
                </Button>
              </div>
            </DrawerHeader>

            <div className="mx-auto grid w-full max-w-(--breakpoint-lg) flex-1 grid-cols-1 content-start gap-5 overflow-y-auto px-4 py-4 md:grid-cols-[3fr_2fr] md:gap-12 md:px-8 md:py-5">
              <div className="space-y-5 md:space-y-8">
                <RentBalanceSummary rent={rent} />
                <Section title={t('Statement')}>
                  <RentCharges rent={rent} />
                </Section>
                <Section title={t('Payments')}>
                  <RentPayments rent={rent} />
                </Section>
              </div>
              <div className="space-y-5 md:space-y-8">
                {properties.length > 1 ? (
                  <Section title={t('Properties')}>
                    <ul className="space-y-1 py-1.5 text-base md:py-0 md:text-sm">
                      {properties.map(({ id, name }) => (
                        <li key={id} className="wrap-break-word">
                          {name}
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}
                <Section title={t('Emails sent')}>
                  <RentEmailsSent rent={rent} />
                  {!rent.occupant.hasContactEmails ? (
                    <p className="mt-2 text-base text-warning md:text-sm">
                      {t(
                        'This tenant has no email address. Add one in the tenant file to send notices and receipts.'
                      )}{' '}
                      <Link href={tenantHref} className="underline">
                        {t('Open tenant file')}
                      </Link>
                    </p>
                  ) : null}
                </Section>
                {rent.description?.trim() ? (
                  <Section title={t('Note')}>
                    <p className="py-1.5 text-base whitespace-pre-line wrap-break-word md:py-0 md:text-sm">
                      {rent.description.trim()}
                    </p>
                  </Section>
                ) : null}
              </div>
            </div>

            <DrawerActionBar>
              <RentDrawerActions
                rent={rent}
                onPay={closeThen(onPay)}
                onSend={closeThen(onSend)}
                onHistory={closeThen(onHistory)}
              />
            </DrawerActionBar>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
