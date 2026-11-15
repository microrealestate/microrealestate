import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@microrealestate/commonui/components/ui/alert';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import { Input } from '@microrealestate/commonui/components/ui/input';
import { Label } from '@microrealestate/commonui/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem
} from '@microrealestate/commonui/components/ui/radio-group';
import { toast } from '@microrealestate/commonui/components/ui/sonner';
import { cn } from '@microrealestate/commonui/utils';
import type { RentEmailName } from '@microrealestate/shared';
import { flowResult } from 'mobx';
import moment from 'moment';
import { useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useId, useState } from 'react';
import { LuCheck, LuInfo, LuTriangleAlert } from 'react-icons/lu';
import { RiMailSendLine } from 'react-icons/ri';
import { useStore } from '@/providers/StoreProvider';
import ResponsiveDialog from '../ResponsiveDialog';
import {
  canGetReceipt,
  RENT_DOCUMENTS,
  SUGGESTION_REASONS,
  type SuggestedDocument,
  suggestedDocument
} from './rentDocuments';
import { rentStatus } from './rentView';
import type { MonthRent } from './types';

type Warning = {
  id: string;
  title: string;
  text: string;
  tickLabel: string;
  dataCy: string;
};

const NAMES_SHOWN = 3;

export default function SendByEmailDialog({
  open,
  setOpen,
  data: rents,
  onDone
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: MonthRent[];
  onDone?: (isEmailSent: boolean) => void;
}) {
  const t = useTranslations('common');
  const locale = useLocale();
  const store = useStore();
  const [chosen, setChosen] = useState<RentEmailName | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [ticked, setTicked] = useState<Set<string>>(new Set());

  const suggested = suggestedDocument(rents);
  const documentName = chosen ?? suggested;
  const targets =
    documentName === 'receipt' ? rents.filter(canGetReceipt) : rents;
  const isFinalReminder = documentName === 'rentnotice_last_reminder';
  const alreadyReceipted =
    documentName === 'receipt'
      ? targets.filter((rent) => rent.emailStatus?.status?.receipt)
      : [];
  const alreadyPaid =
    documentName === 'rentnotice' || documentName === 'rentnotice_reminder'
      ? targets.filter((rent) => rentStatus(rent) === 'paid')
      : [];
  const confirmWord = t('Final reminder');
  // Case, accents and outer spaces are ignored
  const comparable = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLocaleLowerCase(locale);
  const confirmed = comparable(confirmText) === comparable(confirmWord);

  const unavailableReason = (name: RentEmailName) => {
    if (name === 'rentnotice_last_reminder' && rents.length > 1) {
      return t('Send it to one tenant at a time, from the rent details.');
    }
    if (name === 'receipt' && !rents.some(canGetReceipt)) {
      return t('Record a payment first.');
    }
    return null;
  };

  const pick = (name: RentEmailName) => {
    setChosen(name);
    setConfirmText('');
    setTicked(new Set());
  };

  const tick = (id: string, checked: boolean) => {
    setTicked((ids) => {
      const next = new Set(ids);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const close = (isEmailSent: boolean) => {
    setOpen(false);
    onDone?.(isEmailSent);
    // After the closing animation, so the choice does not flicker
    setTimeout(() => {
      setChosen(null);
      setConfirmText('');
      setTicked(new Set());
    }, 300);
  };

  const handleSend = async () => {
    setSending(true);
    let result: { status?: number; message?: string };
    try {
      result = await flowResult(
        store.rent.sendEmail({
          document: documentName,
          tenantIds: targets.map((rent) => rent._id),
          terms: targets.map((rent) => rent.term)
        })
      );
    } catch {
      result = {};
    }
    setSending(false);
    if (result.message === 'missing domain') {
      toast.error(
        t(
          'No domain configured. Set one in the Web server settings to send this email.'
        )
      );
      onDone?.(false);
      return;
    }
    if (result.status !== 200) {
      toast.error(
        t(
          'The email could not be sent. Check the email settings of your organization.'
        )
      );
      onDone?.(false);
      return;
    }
    close(true);
  };

  const warnings: Warning[] = [];
  if (alreadyReceipted.length) {
    const sentDate = rents[0].emailStatus?.last?.receipt?.sentDate;
    warnings.push({
      id: 'receiptResend',
      title: t('Receipt already sent'),
      text:
        rents.length === 1
          ? t('{tenant} got it on {date}.', {
              tenant: rents[0].occupant.name,
              date: moment(sentDate).format('ll')
            })
          : t(
              '{count, plural, one {# tenant already got it} other {# tenants already got it}}. They will get it again.',
              { count: alreadyReceipted.length }
            ),
      tickLabel: t('Send it again'),
      dataCy: 'receiptResendConfirm'
    });
  }
  if (alreadyPaid.length) {
    warnings.push({
      id: 'alreadyPaid',
      title: t('Rent already paid'),
      text:
        rents.length === 1
          ? t('{tenant} has nothing left to pay this month.', {
              tenant: rents[0].occupant.name
            })
          : t(
              '{count, plural, one {# tenant has} other {# tenants have}} nothing left to pay this month.',
              { count: alreadyPaid.length }
            ),
      tickLabel: t('Send it anyway'),
      dataCy: 'paidNoticeConfirm'
    });
  }
  const allTicked = warnings.every(({ id }) => ticked.has(id));

  const recipients = () => {
    const names = rents.map((rent) => rent.occupant.name);
    if (names.length <= NAMES_SHOWN) {
      return t('To {names}', {
        names: new Intl.ListFormat(locale, { type: 'conjunction' }).format(
          names
        )
      });
    }
    return t(
      'To {names} and {count, plural, one {# other tenant} other {# other tenants}}',
      {
        names: names.slice(0, NAMES_SHOWN).join(', '),
        count: names.length - NAMES_SHOWN
      }
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={(isOpen: boolean) => (isOpen ? setOpen(true) : close(false))}
      title={t('Send by email')}
      renderHeader={() => (
        <div className="flex flex-col gap-1">
          <div>{t('Send by email')}</div>
          <div className="text-sm font-normal text-muted-foreground">
            {recipients()}
          </div>
        </div>
      )}
      renderContent={() => {
        let view: ReactNode;
        if (rents.length === 1) {
          const picked =
            RENT_DOCUMENTS.find(({ name }) => name === documentName) ??
            RENT_DOCUMENTS[0];
          view = (
            <>
              <DocumentTimeline
                rent={rents[0]}
                value={documentName}
                suggested={suggested}
                reasonFor={unavailableReason}
                disabled={sending}
                onChange={pick}
              />
              <div className="hidden items-start gap-3 rounded-md bg-muted/40 p-4 sm:flex">
                <picked.Icon
                  className={cn('mt-0.5 size-5 shrink-0', picked.tone)}
                />
                <div className="min-w-0 space-y-1">
                  <div className="font-medium">{t(picked.label)}</div>
                  <div className="text-sm text-muted-foreground">
                    {t(picked.description)}
                  </div>
                </div>
              </div>
            </>
          );
        } else {
          view = (
            <DocumentList
              rents={rents}
              value={documentName}
              reasonFor={unavailableReason}
              disabled={sending}
              onChange={pick}
            />
          );
        }
        const someLeftOut = targets.length > 0 && targets.length < rents.length;
        return (
          <div className="flex w-full flex-col gap-6">
            {view}
            {someLeftOut && documentName === 'receipt' ? (
              <p className="text-sm text-muted-foreground">
                {t(
                  'Only the {count, plural, one {tenant who paid gets} other {# tenants who paid get}} the receipt.',
                  { count: targets.length }
                )}
              </p>
            ) : null}
            {warnings.map((warning) => (
              <ConfirmAlert
                key={warning.id}
                warning={warning}
                checked={ticked.has(warning.id)}
                disabled={sending}
                onCheckedChange={(checked) => tick(warning.id, checked)}
              />
            ))}
            {isFinalReminder ? (
              <Alert
                variant="destructive"
                className="border-0 bg-destructive/10"
              >
                <LuTriangleAlert className="size-4" />
                <AlertTitle>
                  {t('This is the last step before legal action')}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    {t(
                      'Send it only if you are ready to start proceedings if the rent stays unpaid.'
                    )}
                  </p>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="final-reminder-confirm"
                      className="font-normal text-foreground"
                    >
                      {t.rich('Type <b>{word}</b> to confirm', {
                        word: confirmWord,
                        b: (chunks) => <strong>{chunks}</strong>
                      })}
                    </Label>
                    <Input
                      id="final-reminder-confirm"
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value)}
                      disabled={sending}
                      autoComplete="off"
                      data-cy="finalReminderConfirm"
                      className="text-foreground"
                    />
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        );
      }}
      renderFooter={() => (
        <>
          <Button variant="outline" onClick={() => close(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleSend}
            className="gap-2"
            variant={isFinalReminder ? 'destructive' : 'default'}
            disabled={
              !targets.length || (isFinalReminder && !confirmed) || !allTicked
            }
            data-cy="sendEmailConfirm"
          >
            <RiMailSendLine className="size-4" />
            {t('Send to {count, plural, one {# tenant} other {# tenants}}', {
              count: targets.length
            })}
          </Button>
        </>
      )}
      isLoading={sending}
      fullScreen
    />
  );
}

function DocumentTimeline({
  rent,
  value,
  suggested,
  reasonFor,
  disabled,
  onChange
}: {
  rent: MonthRent;
  value: RentEmailName;
  suggested: SuggestedDocument;
  reasonFor: (name: RentEmailName) => string | null;
  disabled: boolean;
  onChange: (name: RentEmailName) => void;
}) {
  const t = useTranslations('common');
  const promptId = useId();

  const sentCaption = (name: RentEmailName) => {
    const sentDate = rent.emailStatus?.last?.[name]?.sentDate;
    return sentDate
      ? t('Sent {date}', { date: moment(sentDate).format('D MMM') })
      : null;
  };

  const linkInto = (name: RentEmailName) =>
    cn(
      name === 'receipt' && 'border-dashed',
      sentCaption(name) ? 'border-primary' : 'border-border'
    );

  return (
    <div className="space-y-4">
      <div id={promptId} className="text-sm font-medium">
        {t('Choose the document to send')}
      </div>
      <Alert data-cy="sendSuggestionReason">
        <LuInfo className="size-4" />
        <AlertDescription>{t(SUGGESTION_REASONS[suggested])}</AlertDescription>
      </Alert>
      <RadioGroup
        aria-labelledby={promptId}
        value={value}
        onValueChange={(name) => onChange(name as RentEmailName)}
        disabled={disabled}
        className="grid-cols-1 gap-0 sm:grid-cols-4"
      >
        {RENT_DOCUMENTS.map((document, index) => {
          const id = `send_${document.name}`;
          const next = RENT_DOCUMENTS[index + 1];
          const reason = reasonFor(document.name);
          const off = !!reason;
          const sent = sentCaption(document.name);
          let caption: ReactNode = null;
          if (reason) {
            caption = reason;
          } else if (sent) {
            caption = (
              <span className="inline-flex items-center gap-1">
                <LuCheck className="size-3.5 text-success" aria-hidden="true" />
                {sent}
              </span>
            );
          } else if (document.name === suggested) {
            caption = <span className="text-primary">{t('Recommended')}</span>;
          } else {
            caption = t('Not sent');
          }
          const previous = RENT_DOCUMENTS[index - 1];
          return (
            <Label
              key={document.name}
              htmlFor={id}
              data-cy={`sendDocument-${document.name}`}
              className={cn(
                'relative flex items-start gap-3 rounded-md px-2 py-3.5 font-normal leading-5 transition-colors sm:flex-col sm:items-center sm:gap-2.5 sm:py-3 sm:text-center',
                'has-data-[state=checked]:bg-primary/10 has-data-[state=checked]:[&_.step-name]:text-primary has-focus-visible:ring-2 has-focus-visible:ring-ring',
                off ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-muted/60'
              )}
            >
              {previous ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-4.25 top-0 z-10 h-6 border-l-2 sm:hidden',
                    linkInto(document.name)
                  )}
                />
              ) : null}
              {next ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute bottom-0 left-4.25 top-6 z-10 border-l-2 sm:hidden',
                    linkInto(next.name)
                  )}
                />
              ) : null}
              {next ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-1/2 top-5.25 z-10 hidden w-full border-t-2 sm:block',
                    linkInto(next.name)
                  )}
                />
              ) : null}
              <span className="relative z-20 grid size-5 shrink-0 place-items-center rounded-full bg-background">
                <RadioGroupItem
                  value={document.name}
                  id={id}
                  disabled={off}
                  className={cn(
                    'size-5 border-2 border-muted-foreground/40 bg-background shadow-none dark:bg-background disabled:border-muted-foreground/30 disabled:opacity-100 [&_svg]:hidden',
                    'data-[state=checked]:border-[6px] data-[state=checked]:border-primary',
                    sent && 'border-primary',
                    off && 'border-dashed'
                  )}
                />
                {sent && value !== document.name ? (
                  <LuCheck
                    className="pointer-events-none absolute size-3 text-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 sm:flex-none">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 sm:block sm:space-y-1">
                  <span
                    className={cn(
                      'step-name block font-medium',
                      off && 'opacity-60'
                    )}
                  >
                    {t(document.shortLabel)}
                  </span>
                  {caption ? (
                    <span className="block text-xs text-muted-foreground">
                      {caption}
                    </span>
                  ) : null}
                </span>
                {value === document.name ? (
                  <span className="mt-1 block text-sm text-muted-foreground sm:hidden">
                    {t(document.description)}
                  </span>
                ) : null}
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function DocumentList({
  rents,
  value,
  reasonFor,
  disabled,
  onChange
}: {
  rents: MonthRent[];
  value: RentEmailName;
  reasonFor: (name: RentEmailName) => string | null;
  disabled: boolean;
  onChange: (name: RentEmailName) => void;
}) {
  const t = useTranslations('common');
  return (
    <RadioGroup
      aria-label={t('Choose the document to send')}
      value={value}
      onValueChange={(name) => onChange(name as RentEmailName)}
      disabled={disabled}
      className="gap-1"
    >
      {RENT_DOCUMENTS.map((document) => {
        const id = `send_${document.name}`;
        const reason = reasonFor(document.name);
        const off = !!reason;
        const sentCount = rents.filter(
          (rent) => rent.emailStatus?.status?.[document.name]
        ).length;
        return (
          <Label
            key={document.name}
            htmlFor={id}
            data-cy={`sendDocument-${document.name}`}
            className={cn(
              'flex items-start gap-3 rounded-md p-3 font-normal',
              off
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-pointer hover:bg-muted/50 has-data-[state=checked]:bg-primary/5'
            )}
          >
            <RadioGroupItem
              value={document.name}
              id={id}
              disabled={off}
              className="mt-0.5"
            />
            <document.Icon className={cn('size-5 shrink-0', document.tone)} />
            <div className="min-w-0 space-y-0.5">
              <div className="font-medium">{t(document.label)}</div>
              <div className="text-sm text-muted-foreground">
                {reason ?? t(document.description)}
              </div>
              {sentCount ? (
                <div className="text-xs text-muted-foreground">
                  {t(
                    '{count, plural, one {Sent to # tenant} other {Sent to # tenants}}',
                    { count: sentCount }
                  )}
                </div>
              ) : null}
            </div>
          </Label>
        );
      })}
    </RadioGroup>
  );
}

function ConfirmAlert({
  warning,
  checked,
  disabled,
  onCheckedChange
}: {
  warning: Warning;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Alert variant="warning" className="border-0 bg-warning/10">
      <LuTriangleAlert className="size-4" />
      <AlertTitle>{warning.title}</AlertTitle>
      <AlertDescription className="space-y-3 text-foreground">
        <p>{warning.text}</p>
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => onCheckedChange(value === true)}
            disabled={disabled}
            data-cy={warning.dataCy}
          />
          {warning.tickLabel}
        </Label>
      </AlertDescription>
    </Alert>
  );
}
