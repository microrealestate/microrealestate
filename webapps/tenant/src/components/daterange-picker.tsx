'use client';
import { DateRange, SelectRangeEventHandler } from 'react-day-picker';
// TODO: import only the locale needed
// TODO: remove momentjs and use date-fns
import { de, enUS, fr, ptBR } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/utils';
import { format } from 'date-fns';
import useTranslation from '@/utils/i18n/client/useTranslation';

export function DateRangePicker({
  className,
  onValueChange,
}: {
  className?: string;
  onValueChange?: (range: DateRange | undefined) => void;
}) {
  const [rangeDate, setRangeDate] = useState<DateRange | undefined>();
  const { t, locale } = useTranslation();

  const handleChange = useCallback<SelectRangeEventHandler>(
    (range: DateRange | undefined) => {
      setRangeDate(range);
      onValueChange?.(range);
    },
    [onValueChange]
  );

  let fnsLocale = enUS;
  if (locale === 'fr') {
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
            initialFocus
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
