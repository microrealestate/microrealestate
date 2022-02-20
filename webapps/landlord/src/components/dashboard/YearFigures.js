import {
  Bar,
  BarChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { Box, Grid, Paper, Typography, useTheme } from '@material-ui/core';
import { useCallback, useContext, useMemo } from 'react';

import moment from 'moment';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import { useFormatNumber } from '../../utils/numberformat';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function YearFigures() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');
  const formatNumber = useFormatNumber();
  const theme = useTheme();

  const data = useMemo(() => {
    const now = moment();
    return store.dashboard.data.revenues?.reduce((acc, revenues) => {
      const revenuesMoment = moment(revenues.month, 'MMYYYY');
      const graphData = {
        ...revenues,
        name: revenuesMoment.format('MMM'),
        yearMonth: moment(revenues.month, 'MMYYYY').format('YYYY.MM'),
      };
      if (revenuesMoment.isSameOrBefore(now)) {
        acc.push(graphData);
      } else {
        acc.push({
          ...graphData,
          notPaid: 0,
        });
      }
      return acc;
    }, []);
  }, [store.dashboard.data.revenues]);

  const hasRevenues = useMemo(() => {
    return data.some((r) => r.notPaid !== 0 || r.paid !== 0);
  }, [data]);

  const onClick = useCallback(
    (data) => {
      if (
        !data?.activePayload?.[0]?.payload ||
        !store.organization.selected?.name
      ) {
        return;
      }
      const {
        activePayload: [
          {
            payload: { yearMonth },
          },
        ],
      } = data;
      store.rent.setPeriod(moment(yearMonth, 'YYYY.MM', true));
      router.push(`/${store.organization.selected.name}/rents/${yearMonth}`);
    },
    [router, store.rent, store.organization.selected.name]
  );

  return hasRevenues ? (
    <>
      <Box mb={3}>
        <Typography variant="h5">
          {t('Rents of {{year}}', {
            year: moment().format('YYYY'),
          })}
        </Typography>
      </Box>
      <Grid container>
        <Grid item xs={12}>
          <Paper>
            <Box py={2} px={3} width="100%" height={600}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  stackOffset="sign"
                  onClick={onClick}
                >
                  <XAxis
                    type="number"
                    hide={true}
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis
                    dataKey="name"
                    hide={false}
                    axisLine={false}
                    tickLine={false}
                    type="category"
                  />
                  <Legend
                    verticalAlign="top"
                    height={40}
                    formatter={(value) =>
                      value === 'paid' ? t('Rent paid') : t('Rents not paid')
                    }
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="notPaid"
                    fill={theme.palette.warning.dark}
                    stackId="stack"
                    cursor="pointer"
                    background={{ fill: theme.palette.grey[300] }}
                    label={{
                      fill: theme.palette.grey[50],
                      formatter: (value) =>
                        value < 0 ? formatNumber(value) : '',
                    }}
                  />

                  <Bar
                    isAnimationActive={false}
                    dataKey="paid"
                    fill={theme.palette.success.dark}
                    stackId="stack"
                    cursor="pointer"
                    label={{
                      fill: theme.palette.grey[50],
                      formatter: (value) =>
                        value > 0 ? formatNumber(value) : '',
                    }}
                  />
                  <ReferenceLine x={0} stroke={theme.palette.grey[400]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  ) : null;
}

export default observer(YearFigures);
