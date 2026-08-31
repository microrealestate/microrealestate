import { FieldArray } from 'formik';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { useLocale, useTranslations } from 'next-intl';
import { Fragment, useState } from 'react';
import { LuCirclePlus, LuTriangleAlert, LuX } from 'react-icons/lu';
import { useFormatNumber } from '../../providers/CurrencyProvider';
import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { DateField } from './DateField';
import { NumberField } from './NumberField';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

type PaymentItemBase = {
  key: string;
  type?: string;
  paymentType?: string;
  date?: moment.Moment | string | null;
  reference?: string;
  amount?: number;
};

export function PaymentsField<TItem extends PaymentItemBase>({
  name,
  items,
  emptyItem,
  addLabel,
  renderTitle,
  typeKey = 'type',
  paymentTypes,
  defaultMonth,
  dataCy,
  readOnly = false,
  minItems = 1
}: {
  name: string;
  items?: TItem[];
  emptyItem?: Omit<TItem, 'key'>;
  addLabel: string;
  renderTitle?: (item: TItem, index: number) => React.ReactNode;
  typeKey?: 'type' | 'paymentType';
  paymentTypes: {
    id: string;
    label: string;
    value: string;
    renderIcon?: () => React.ReactNode;
    disabled?: boolean;
  }[];
  defaultMonth?: moment.Moment;
  dataCy?: { reference?: string; amount?: string };
  readOnly?: boolean;
  minItems?: number;
}) {
  const t = useTranslations('common');
  const locale = useLocale();
  const formatNumber = useFormatNumber();
  const cyLabel = `${name}Item`;
  const [pendingRemove, setPendingRemove] = useState<{
    index: number;
    item: TItem;
  } | null>(null);

  const getPaymentMethodLabel = (value: string) => {
    const type = paymentTypes?.find((t) => t.value === value);
    return type?.label || value || '-';
  };

  const formatDate = (date: moment.Moment | string | null) => {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.locale(locale).format('L') : '-';
  };

  const renderPaymentItem = (payment: TItem, index: number) => {
    const currentType = payment[typeKey] ?? '';
    const editableReference = currentType !== 'cash';
    const namePrefix = `${name}[${index}]`;

    return (
      <div
        className={cn(
          'grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4 items-start'
        )}
      >
        <DateField
          label={t('Date')}
          name={`${namePrefix}.date`}
          defaultMonth={defaultMonth}
          disabled={readOnly}
        />
        <SelectField
          label={t('Payment method')}
          name={`${namePrefix}.${typeKey}`}
          values={paymentTypes}
          disabled={readOnly}
        />
        <TextField
          label={t('Reference')}
          name={`${namePrefix}.reference`}
          {...(dataCy?.reference
            ? { 'data-cy': `${dataCy.reference}-${index}` }
            : {})}
          disabled={readOnly || !editableReference}
        />
        <NumberField
          label={t('Amount')}
          name={`${namePrefix}.amount`}
          {...(dataCy?.amount
            ? { 'data-cy': `${dataCy.amount}-${index}` }
            : {})}
          disabled={readOnly}
        />
      </div>
    );
  };

  const renderReadOnlyItem = (payment: TItem) => {
    const currentType = payment[typeKey] ?? '';
    const date = formatDate(payment.date ?? null);
    const method = getPaymentMethodLabel(currentType);
    const reference = payment.reference || '';
    const amount = payment.amount ?? 0;
    const formattedAmount = formatNumber(amount);

    return (
      <div
        className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-sm')}
      >
        <span>{date}</span>
        <span>{method}</span>
        <span>{formattedAmount}</span>
        {reference && (
          <span className="text-muted-foreground">{reference}</span>
        )}
      </div>
    );
  };

  if (readOnly) {
    return (
      <div className="space-y-4">
        {items?.map((item, index) => (
          <Fragment key={item.key}>
            {renderTitle && (
              <div className="text-muted-foreground mb-3">
                {renderTitle(item, index)}
              </div>
            )}
            <div>{renderReadOnlyItem(item)}</div>
          </Fragment>
        ))}
        {(!items || items.length === 0) && (
          <div className="text-sm text-muted-foreground">{t('No items')}</div>
        )}
      </div>
    );
  }

  return (
    <FieldArray
      name={name}
      render={(arrayHelpers) => {
        return (
          <div className="space-y-4">
            {items?.map((item, index) => (
              <Card key={item.key}>
                <CardHeader className="bg-muted py-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    {renderTitle ? renderTitle(item, index) : null}
                  </div>
                  {items && items.length > minItems && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        const hasAmount =
                          item.amount !== null &&
                          item.amount !== undefined &&
                          String(item.amount) !== '' &&
                          Number(item.amount) > 0;
                        if (hasAmount) {
                          setPendingRemove({ index, item });
                        } else {
                          arrayHelpers.remove(index);
                        }
                      }}
                      data-cy={`remove${cyLabel}${index}`}
                    >
                      <LuX className="size-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderPaymentItem(item, index)}
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  arrayHelpers.push({ ...emptyItem, key: nanoid() });
                }}
                className="gap-1"
                data-cy={`add${name}`}
              >
                <LuCirclePlus className="size-4" />
                {addLabel}
              </Button>
            </div>

            <Dialog
              open={!!pendingRemove}
              onOpenChange={(open) => {
                if (!open) {
                  setPendingRemove(null);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex flex-col md:flex-row items-center gap-2">
                    <LuTriangleAlert className="size-8" />
                    <span>{t('Are you sure to remove this payment?')}</span>
                  </DialogTitle>
                  <DialogDescription className="text-center md:text-left">
                    {pendingRemove
                      ? `${formatNumber(pendingRemove.item.amount ?? 0)} - ${formatDate(pendingRemove.item.date ?? null)}`
                      : ''}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPendingRemove(null)}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (pendingRemove) {
                        arrayHelpers.remove(pendingRemove.index);
                      }
                      setPendingRemove(null);
                    }}
                    data-cy={`confirmRemove${cyLabel}`}
                  >
                    {t('Continue')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      }}
    />
  );
}
