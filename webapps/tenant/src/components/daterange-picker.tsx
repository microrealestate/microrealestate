'use client';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Calendar } from '@microrealestate/commonui/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { cn } from '@microrealestate/commonui/utils';
import type { DateRange } from '@microrealestate/shared';
import { format } from 'date-fns';
// TODO: import only the locale needed
// TODO: remove momentjs and use date-fns
import { de, enUS, fr, ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

export function DateRangePicker({
  className,
  onValueChange
}: {
  className?: string;
  onValueChange?: (range: DateRange | undefined) => void;
}) {
  const [rangeDate, setRangeDate] = useState<DateRange | undefined>();
  const t = useTranslations('common');
  const locale = useLocale();

  const handleChange = useCallback(
    (range: DateRange | undefined) => {
      setRangeDate(range);
      onValueChange?.(range);
    },
    [onValueChange]
  );

  let fnsLocale = enUS;
  if (locale === 'fr-FR') {
    fnsLocale = fr;
  } else if (locale === 'de-DE') {
    fnsLocale = de;
  } else if (locale === 'pt-BR') {
    fnsLocale = ptBR;
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
