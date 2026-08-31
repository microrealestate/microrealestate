import type { LeaseTimeRange } from '@microrealestate/shared';
import moment, { type Moment } from 'moment';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { LuCalendar, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import 'react-day-picker/style.css';
import { useLocaleContext } from '../../providers/AppProvider';
import { cn } from '../../utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type MomentUnit = 'hour' | 'day' | 'week' | 'month' | 'year';

const TIME_RANGE_UNIT: Record<LeaseTimeRange, MomentUnit> = {
  hours: 'hour',
  days: 'day',
  weeks: 'week',
  months: 'month',
  years: 'year'
};

const TIME_RANGE_FORMAT: Record<LeaseTimeRange, string> = {
  hours: 'LLL',
  days: 'LL',
  weeks: '[W]W YYYY',
  months: 'MMM YYYY',
  years: 'YYYY'
};

export function bucketBounds(
  date: Moment,
  timeRange: LeaseTimeRange
): { from: Moment; to: Moment } {
  const unit = TIME_RANGE_UNIT[timeRange];
  return {
    from: date.clone().startOf(unit),
    to: date.clone().endOf(unit)
  };
}

interface PeriodRangePickerProps {
  timeRange: LeaseTimeRange;
  from: Moment | null;
  onChange: (range: { from: Moment; to: Moment } | null) => void;
  className?: string;
  dataCy?: string;
  clearable?: boolean;
}

interface MonthGridProps {
  bucket: Moment;
  selected: boolean;
  onSelect: (date: Moment) => void;
}

function MonthGrid({ bucket, selected, onSelect }: MonthGridProps) {
  const t = useTranslations('common');
  const [viewYear, setViewYear] = useState(bucket.year());

  useEffect(() => {
    setViewYear(bucket.year());
  }, [bucket]);

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => moment().month(i).format('MMM')),
    []
  );

  return (
    <div className="p-3 w-64">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setViewYear((y) => y - 1)}
          aria-label={t('Previous')}
        >
          <LuChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">{viewYear}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setViewYear((y) => y + 1)}
          aria-label={t('Next')}
        >
          <LuChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((label, i) => {
          const isSelected =
            selected && viewYear === bucket.year() && i === bucket.month();
          return (
            <Button
              key={label}
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              className="h-9 text-sm"
              onClick={() => onSelect(moment().year(viewYear).month(i).date(1))}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface YearGridProps {
  bucket: Moment;
  selected: boolean;
  onSelect: (date: Moment) => void;
}

const YEARS_PER_PAGE = 12;

function YearGrid({ bucket, selected, onSelect }: YearGridProps) {
  const t = useTranslations('common');
  const [decadeStart, setDecadeStart] = useState(
    Math.floor(bucket.year() / YEARS_PER_PAGE) * YEARS_PER_PAGE
  );

  useEffect(() => {
    setDecadeStart(Math.floor(bucket.year() / YEARS_PER_PAGE) * YEARS_PER_PAGE);
  }, [bucket]);

  const years = useMemo(
    () => Array.from({ length: YEARS_PER_PAGE }, (_, i) => decadeStart + i),
    [decadeStart]
  );

  return (
    <div className="p-3 w-64">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setDecadeStart((d) => d - YEARS_PER_PAGE)}
          aria-label={t('Previous')}
        >
          <LuChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {decadeStart} – {decadeStart + YEARS_PER_PAGE - 1}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setDecadeStart((d) => d + YEARS_PER_PAGE)}
          aria-label={t('Next')}
        >
          <LuChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => {
          const isSelected = selected && year === bucket.year();
          return (
            <Button
              key={year}
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              className="h-9 text-sm"
              onClick={() => onSelect(moment().year(year).month(0).date(1))}
            >
              {year}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function PeriodRangePicker({
  timeRange,
  from,
  onChange,
  className,
  dataCy,
  clearable = true
}: PeriodRangePickerProps) {
  const t = useTranslations('common');
  const nextLocale = useLocale();
  const { dateFnsLocale } = useLocaleContext();
  const [open, setOpen] = useState(false);

  const unit = TIME_RANGE_UNIT[timeRange];
  const format = TIME_RANGE_FORMAT[timeRange];

  const bucket = useMemo(() => (from ? from.clone() : moment()), [from]);
  const label = from ? bucket.format(format) : t('All time');

  const shift = (delta: number) => {
    if (!from) {
      onChange(bucketBounds(moment(), timeRange));
      return;
    }
    const next = bucket.clone().add(delta, unit);
    onChange(bucketBounds(next, timeRange));
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(bucketBounds(moment(date), timeRange));
    setOpen(false);
  };

  const handleGridSelect = (date: Moment) => {
    onChange(bucketBounds(date, timeRange));
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  const renderPopoverBody = () => {
    if (timeRange === 'months') {
      return (
        <MonthGrid
          bucket={bucket}
          selected={!!from}
          onSelect={handleGridSelect}
        />
      );
    }
    if (timeRange === 'years') {
      return (
        <YearGrid
          bucket={bucket}
          selected={!!from}
          onSelect={handleGridSelect}
        />
      );
    }
    return (
      <Calendar
        mode="single"
        defaultMonth={bucket.toDate()}
        selected={from ? bucket.toDate() : undefined}
        onSelect={handleCalendarSelect}
        captionLayout="dropdown"
        locale={dateFnsLocale}
        formatters={{
          formatMonthDropdown: (month) =>
            month.toLocaleString(nextLocale, { month: 'short' })
        }}
      />
    );
  };

  return (
    <div
      className={cn(
        'flex items-center rounded-md border-dotted border-2 bg-secondary text-secondary-foreground h-10 px-1 text-sm',
        className
      )}
      data-cy={dataCy}
    >
      {from ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => shift(-1)}
          aria-label={t('Previous')}
        >
          <LuChevronLeft />
        </Button>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'flex items-center px-1 h-7 gap-1 font-medium text-sm leading-none',
              from ? 'uppercase' : ''
            )}
          >
            <LuCalendar />
            <span className="pt-0.5">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {renderPopoverBody()}
          {clearable && from ? (
            <div className="flex justify-end border-t p-2">
              <Button variant="ghost" size="sm" onClick={handleClear}>
                {t('Clear')}
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
      {from ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => shift(1)}
          aria-label={t('Next')}
        >
          <LuChevronRight />
        </Button>
      ) : null}
    </div>
  );
}
