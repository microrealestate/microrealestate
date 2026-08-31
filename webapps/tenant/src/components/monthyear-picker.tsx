'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@microrealestate/commonui/components/ui/select';
import moment from 'moment';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function MonthYearPicker({
  variant = 'monthyear',
  fromDate,
  toDate,
  onValueChange
}: {
  variant: 'monthyear' | 'year';
  fromDate: Date;
  toDate: Date;
  onValueChange?: ({
    month,
    year
  }: {
    month?: number | undefined;
    year: number;
  }) => void;
}) {
  const t = useTranslations('common');
  const locale = useLocale();
  const months = useMemo(
    () => moment().locale(locale).localeData().months(),
    [locale]
  );
  const endYear = moment(toDate).year();
  const years = useMemo(() => {
    const startYear = moment(fromDate).year();
    const yearCount = moment(toDate).year();
    const years = [];
    for (let i = startYear; i <= yearCount; i++) {
      years.push(i);
    }
    return years;
  }, [fromDate, toDate]);
  const [month, setMonth] = useState<number | undefined>();
  const [year, setYear] = useState<number>(endYear);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      onValueChange?.({ year: endYear });
    }
  }, [endYear, onValueChange]);

  const handleMonthChange = (value: string) => {
    const monthIndex = Number(value);
    if (monthIndex >= 0) {
      setMonth(monthIndex);
      onValueChange?.({ month: monthIndex, year });
    } else {
      setMonth(undefined);
      onValueChange?.({ year });
    }
  };

  const handleYearChange = (value: string) => {
    setYear(Number(value));
    onValueChange?.({
      ...(month !== undefined && { month }),
      year: Number(value)
    });
  };

  return (
    <div className="flex gap-2 sm:w-60">
      {variant === 'monthyear' ? (
        <Select defaultValue={String(-1)} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-3/5" data-cy="month-picker">
            <SelectValue placeholder={t('Pick a month')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(-1)}>{t('All months')}</SelectItem>
            {months.map((month, index) => (
              <SelectItem key={month} value={String(index)}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Select defaultValue={String(endYear)} onValueChange={handleYearChange}>
        <SelectTrigger className="w-2/5" data-cy="year-picker">
          <SelectValue placeholder={t('Pick a year')} />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={String(year)} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
