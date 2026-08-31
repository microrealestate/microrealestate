import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@microrealestate/commonui/components/ui/dialog';
import { SPONSOR_URL } from '@microrealestate/shared';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { type ElementType, useRef } from 'react';
import { LuCoffee, LuHeart, LuShieldCheck, LuWrench } from 'react-icons/lu';
import {
  fetchPropertyCount,
  fetchTenantCount,
  QueryKeys
} from '@/utils/restcalls';

type Benefit = {
  id: string;
  Icon: ElementType;
  iconClassName: string;
  haloClassName: string;
  label: string;
};

export default function DonateDialog({
  open,
  canDismissForever,
  onSnooze,
  onDismissForever
}: {
  open: boolean;
  canDismissForever: boolean;
  onSnooze: () => void;
  onDismissForever: () => void;
}) {
  const t = useTranslations('common');
  const year = moment().year();
  const sponsorRef = useRef<HTMLAnchorElement>(null);

  const { data: propertyCountData } = useQuery({
    queryKey: [QueryKeys.PROPERTY_COUNT],
    queryFn: () => fetchPropertyCount(),
    enabled: false
  });
  const { data: tenantCountData } = useQuery({
    queryKey: [QueryKeys.TENANT_COUNT, year],
    queryFn: () => fetchTenantCount(year),
    enabled: false
  });

  const propertyCount = propertyCountData?.count ?? 0;
  const tenantCount = tenantCountData?.count ?? 0;
  const hasCounts = propertyCount > 0 && tenantCount > 0;

  const benefits: Benefit[] = [
    {
      id: 'free',
      Icon: LuHeart,
      iconClassName: 'text-primary',
      haloClassName: 'bg-primary/10',
      label: t('Keeps the project alive')
    },
    {
      id: 'features',
      Icon: LuWrench,
      iconClassName: 'text-warning',
      haloClassName: 'bg-warning/10',
      label: t('Funds fixes and new features')
    },
    {
      id: 'privacy',
      Icon: LuShieldCheck,
      iconClassName: 'text-success',
      haloClassName: 'bg-success/10',
      label: t('No ads, no tracking, ever')
    }
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // covers Esc, click outside and the built-in close button
        if (!nextOpen) {
          onSnooze();
        }
      }}
    >
      <DialogContent
        className="max-h-[85vh] overflow-y-auto gap-6 p-6 sm:p-8"
        // radix would otherwise land on the first footer button, which is a
        // dismiss action: put the primary action under the initial focus
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          sponsorRef.current?.focus();
        }}
        data-cy="donateDialog"
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">
            {t("You're doing great!")} 🎉
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {hasCounts
              ? t(
                  '{propertyCount} properties and {tenantCount} tenants, all managed with software that is free to use.',
                  { propertyCount, tenantCount }
                )
              : t(
                  'Everything you manage here runs on software that is free to use.'
                )}
          </DialogDescription>
        </DialogHeader>

        <p className="text-base font-medium">
          {t('Chip in and keep MicroRealEstate growing!')}
        </p>

        <div className="flex flex-col gap-3">
          {benefits.map(({ id, Icon, iconClassName, haloClassName, label }) => (
            <div
              key={id}
              className="flex items-center gap-4 px-4 py-3 border rounded-lg"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${haloClassName}`}
              >
                <Icon className={`size-5 ${iconClassName}`} />
              </span>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          {canDismissForever ? (
            <Button variant="ghost" onClick={onDismissForever}>
              {t("Don't ask again")}
            </Button>
          ) : null}
          <Button variant="outline" onClick={onSnooze}>
            {t('Later')}
          </Button>
          <Button className="group gap-2" asChild>
            <a
              ref={sponsorRef}
              href={SPONSOR_URL}
              target="_blank"
              rel="noreferrer noopener"
              onClick={onSnooze}
              data-cy="donateDialogSponsor"
            >
              <LuCoffee className="size-4 transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110" />
              {t('Buy me a coffee')}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
