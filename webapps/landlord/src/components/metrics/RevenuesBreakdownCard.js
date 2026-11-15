import { ChartContainer } from '@microrealestate/commonui/components/ui/chart';
import { useFormatNumber } from '@microrealestate/commonui/providers/CurrencyProvider';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { LuBanknote } from 'react-icons/lu';
import {
  Bar,
  BarChart,
  LabelList,
  Legend,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis
} from 'recharts';
import { useMediaQuery } from 'usehooks-ts';
import { useRouter } from '@/i18n/navigation';
import { fetchRevenuesBreakdown, QueryKeys } from '@/utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';

const estimateTextWidth = (text, fontSize) => text.length * fontSize * 0.62;

const LABEL_GAP = 4;

const renderAmountLabel =
  ({ side, fontSize, formatNumber }) =>
  ({ viewBox, value }) => {
    if (!value || (side === 'paid' ? value <= 0 : value >= 0)) {
      return null;
    }
    const barLeft = Math.min(viewBox.x, viewBox.x + viewBox.width);
    const barRight = Math.max(viewBox.x, viewBox.x + viewBox.width);
    return (
      <text
        x={side === 'paid' ? barRight + LABEL_GAP : barLeft - LABEL_GAP}
        y={viewBox.y + viewBox.height / 2}
        dominantBaseline="central"
        textAnchor={side === 'paid' ? 'start' : 'end'}
        fontSize={fontSize}
        className="tracking-tight tabular-nums"
        fill={side === 'paid' ? 'var(--success)' : 'var(--warning)'}
      >
        {formatNumber(Math.abs(value))}
      </text>
    );
  };

function revenuesBreakdownCard() {
  const router = useRouter();
  const t = useTranslations('common');
  const formatNumber = useFormatNumber();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const currentYear = moment().year();

  const {
    data: rawData,
    isLoading,
    error
  } = useQuery({
    queryKey: [QueryKeys.REVENUES_BREAKDOWN, currentYear],
    queryFn: () => fetchRevenuesBreakdown(currentYear),
    refetchOnMount: 'always',
    retry: 3
  });

  const data = useMemo(() => {
    const now = moment();
    return rawData?.reduce((acc, revenues) => {
      const revenuesMoment = moment(revenues.month, 'YYYYMM');
      const graphData = {
        ...revenues,
        name: revenuesMoment.format('MMM'),
        yearMonth: revenuesMoment.format('YYYY.MM')
      };
      if (revenuesMoment.isSameOrBefore(now)) {
        acc.push(graphData);
      } else {
        acc.push({
          ...graphData,
          notPaid: 0
        });
      }
      return acc;
    }, []);
  }, [rawData]);

  const labelFontSize = isDesktop ? 12 : 9;
  const barSize = isDesktop ? 18 : 12;
  const yAxisWidth = isDesktop ? 60 : 30;
  // gap between the bars and the lane edges
  const xAxisPadding = isDesktop ? 16 : 8;
  const rowHeight = barSize + (isDesktop ? 14 : 10);
  const legendHeight = 36;
  const chartHeight = (data?.length || 12) * rowHeight + legendHeight;

  const [chartElement, setChartElement] = useState(null);
  const [chartWidth, setChartWidth] = useState(0);
  useEffect(() => {
    if (!chartElement) {
      return;
    }
    const resizeObserver = new ResizeObserver(([entry]) =>
      setChartWidth(entry.contentRect.width)
    );
    resizeObserver.observe(chartElement);
    return () => resizeObserver.disconnect();
  }, [chartElement]);
  const xDomain = useMemo(() => {
    const paid = (data ?? []).map(({ paid }) => Math.max(paid ?? 0, 0));
    const unpaid = (data ?? []).map(({ notPaid }) =>
      Math.max(-(notPaid ?? 0), 0)
    );
    const maxPaid = Math.max(0, ...paid);
    const maxUnpaid = Math.max(0, ...unpaid);
    const plotWidth = chartWidth - yAxisWidth - 2 * xAxisPadding;
    if (plotWidth <= 0 || maxPaid + maxUnpaid === 0) {
      return ['dataMin', 'dataMax'];
    }

    const labelShares = (values) =>
      values
        .filter((value) => value > 0)
        .map((value) => [
          value,
          Math.min(
            (LABEL_GAP +
              estimateTextWidth(formatNumber(value), labelFontSize)) /
              plotWidth,
            0.45
          )
        ]);
    const paidShares = labelShares(paid);
    const unpaidShares = labelShares(unpaid);
    // a label's width in values depends on the span: iterate
    const sideEnd = (shares, span) =>
      shares.reduce(
        (end, [value, share]) => Math.max(end, value + share * span),
        0
      );
    let left = maxUnpaid;
    let right = maxPaid;
    for (let i = 0; i < 50; i++) {
      const span = left + right;
      left = sideEnd(unpaidShares, span);
      right = sideEnd(paidShares, span);
    }
    return [-left, right];
  }, [data, chartWidth, yAxisWidth, xAxisPadding, formatNumber, labelFontSize]);

  const handleClick = (dataKey) => (data) => {
    const { yearMonth } = data;
    const statuses = dataKey === 'paid' ? 'partiallypaid,paid' : 'notpaid';
    const period = moment(yearMonth, 'YYYY.MM', true);
    const from = period.clone().startOf('month').format('YYYY-MM-DD');
    const to = period.clone().endOf('month').format('YYYY-MM-DD');
    router.push(`/rents?from=${from}&to=${to}&filter.statuses=${statuses}`);
  };

  return (
    <DashboardCard
      Icon={LuBanknote}
      title={t('Rents of {year}', {
        year: moment().format('YYYY')
      })}
      description={t('Rents for the year')}
      loading={isLoading}
      renderContent={() =>
        error ? (
          '-'
        ) : (
          <ChartContainer
            ref={setChartElement}
            config={{
              paid: {},
              notPaid: {}
            }}
            className="w-full [&_.recharts-bar-rectangle:hover]:opacity-80"
            style={{ height: chartHeight }}
          >
            <BarChart
              data={data}
              layout="vertical"
              stackOffset="sign"
              margin={{ top: 5, right: 0, bottom: 5, left: 0 }}
            >
              <XAxis
                type="number"
                hide={true}
                domain={xDomain}
                padding={{ left: xAxisPadding, right: xAxisPadding }}
              />
              <YAxis
                dataKey="name"
                hide={false}
                axisLine={false}
                tickLine={false}
                type="category"
                width={yAxisWidth}
                tick={(props) => {
                  const { x, y, payload } = props;
                  return (
                    <text
                      x={x - (isDesktop ? 30 : 22)}
                      y={y}
                      dominantBaseline="central"
                      className="text-[9px] md:text-xs"
                      fill="var(--muted-foreground)"
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                content={() => (
                  <div className="flex justify-center gap-4 text-sm mb-2">
                    <div className="flex items-center gap-2 text-warning">
                      <div className="size-2 bg-(--chart-warning)" />
                      <span>{t('Left to collect')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-success">
                      <div className="size-2 bg-(--chart-success)" />
                      <span>{t('Rent collected')}</span>
                    </div>
                  </div>
                )}
              />
              {/* striped lanes: shade every other month, edge to edge
                  of the chart so they ignore the axis padding */}
              {data
                ?.filter((_, index) => index % 2 === 0)
                .map(({ name }) => (
                  <ReferenceArea
                    key={name}
                    y1={name}
                    y2={name}
                    shape={({ y, height }) => (
                      <rect
                        x={0}
                        y={y}
                        width={chartWidth}
                        height={height}
                        fill="var(--background)"
                      />
                    )}
                  />
                ))}
              <Bar
                dataKey="notPaid"
                fill="var(--chart-warning)"
                stackId="stack"
                radius={[0, 6, 6, 0]}
                barSize={barSize}
                stroke="var(--border)"
                strokeWidth={1}
                onClick={handleClick('notPaid')}
              >
                <LabelList
                  content={renderAmountLabel({
                    side: 'notPaid',
                    fontSize: labelFontSize,
                    formatNumber
                  })}
                />
              </Bar>
              <Bar
                dataKey="paid"
                fill="var(--chart-success)"
                stackId="stack"
                radius={[0, 6, 6, 0]}
                barSize={barSize}
                stroke="var(--border)"
                strokeWidth={1}
                onClick={handleClick('paid')}
              >
                <LabelList
                  content={renderAmountLabel({
                    side: 'paid',
                    fontSize: labelFontSize,
                    formatNumber
                  })}
                />
              </Bar>
              <ReferenceLine x={0} stroke="var(--border)" />
            </BarChart>
          </ChartContainer>
        )
      }
      className="min-w-0"
      contentClassName="px-2 md:px-6"
    />
  );
}

export default observer(revenuesBreakdownCard);
