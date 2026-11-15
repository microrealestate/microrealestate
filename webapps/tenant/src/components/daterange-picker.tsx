'use client';
import { NATIVE_DATE_INPUT_CLASS } from '@microrealestate/commonui/components/formfields/DateField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Calendar } from '@microrealestate/commonui/components/ui/calendar';
import { Input } from '@microrealestate/commonui/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { useLocaleContext } from '@microrealestate/commonui/providers/AppProvider';
import { cn } from '@microrealestate/commonui/utils';
import type { DateRange } from '@microrealestate/shared';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';

export function DateRangePicker({
  className,
  onValueChange
}: {
  className?: string;
  onValueChange?: (range: DateRange | undefined) => void;
}) {
  const [rangeDate, setRangeDate] = useState<DateRange | undefined>();
  const t = useTranslations('common');
  const { dateFnsLocale: fnsLocale } = useLocaleContext();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleChange = useCallback(
    (range: DateRange | undefined) => {
      setRangeDate(range);
      onValueChange?.(range);
    },
    [onValueChange]
  );

  if (!isDesktop) {
    const toInputValue = (date?: Date) =>
      date ? format(date, 'yyyy-MM-dd') : '';
    const fromInputValue = (value: string) =>
      value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;

    return (
      <div className={cn('grid grid-cols-2 gap-2', className)}>
        <Input
          type="date"
          aria-label={t('Start date')}
          className={NATIVE_DATE_INPUT_CLASS}
          value={toInputValue(rangeDate?.from)}
          max={rangeDate?.to ? toInputValue(rangeDate.to) : undefined}
          onChange={(e) => {
            const from = fromInputValue(e.target.value);
            handleChange(
              from || rangeDate?.to ? { from, to: rangeDate?.to } : undefined
            );
          }}
        />
        <Input
          type="date"
          aria-label={t('End date')}
          className={NATIVE_DATE_INPUT_CLASS}
          value={toInputValue(rangeDate?.to)}
          min={rangeDate?.from ? toInputValue(rangeDate.from) : undefined}
          onChange={(e) => {
            const to = fromInputValue(e.target.value);
            handleChange(
              rangeDate?.from || to ? { from: rangeDate?.from, to } : undefined
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'justify-start text-left font-normal',
              !rangeDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {rangeDate?.from ? (
              rangeDate.to ? (
                <>
                  {format(rangeDate.from, 'LLL dd, y', { locale: fnsLocale })} -{' '}
                  {format(rangeDate.to, 'LLL dd, y', { locale: fnsLocale })}
                </>
              ) : (
                format(rangeDate.from, 'LLL dd, y', { locale: fnsLocale })
              )
            ) : (
              <span>{t('Pick a period')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            locale={fnsLocale}
            autoFocus
            mode="range"
            defaultMonth={rangeDate?.from}
            selected={rangeDate}
            onSelect={handleChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
