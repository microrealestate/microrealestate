import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Box, Tooltip, Typography, useTheme } from '@material-ui/core';
import { memo, useMemo } from 'react';

import { CardRow } from '../Cards';
import { NumberFormat } from '../../utils/numberformat';
import RentPeriod from './RentPeriod';
import useTranslation from 'next-translate/useTranslation';

const BalanceBar = memo(function BalanceBar({
  rent,
  hideLeftToPay = true,
  hideTooltip,
}) {
  const { t } = useTranslation('common');
  const theme = useTheme();

  const data = useMemo(() => {
    const leftToPayInBalance = rent.balance - rent.payment;
    const leftToPayInCurrentRent =
      leftToPayInBalance < 0
        ? rent.totalWithoutBalanceAmount + leftToPayInBalance
        : rent.totalWithoutBalanceAmount;
    return [
      {
        name: '',
        payment: rent.payment,
        balance: leftToPayInBalance > 0 ? leftToPayInBalance : 0,
        currentRent: leftToPayInCurrentRent > 0 ? leftToPayInCurrentRent : 0,
      },
    ];
  }, [rent.payment, rent.totalWithoutBalanceAmount, rent.balance]);

  const remainingRentToPay = useMemo(
    () => (rent.newBalance < 0 ? Math.abs(rent.newBalance) : 0),
    [rent.newBalance]
  );

  return (
    <>
      <CardRow>
        <RentPeriod term={rent.term} frequency={rent.occupant.frequency} />
        <NumberFormat variant="h5" value={rent.totalToPay} />
      </CardRow>
      <Tooltip
        disableHoverListener={hideTooltip}
        title={
          <Box width={200}>
            <CardRow>
              <Typography>{t('Balance')}</Typography>
              <NumberFormat value={rent.balance} />
            </CardRow>
            <CardRow pt={1}>
              <Typography>{t('Rent')}</Typography>
              <NumberFormat value={rent.totalWithoutBalanceAmount} />
            </CardRow>
            {!!rent.promo && (
              <CardRow pt={1}>
                <Typography>{t('Discount')}</Typography>
                <NumberFormat value={rent.promo} />
              </CardRow>
            )}
            <CardRow pt={1}>
              <Typography>{t('Total')}</Typography>
              <NumberFormat value={rent.totalToPay} />
            </CardRow>
            <CardRow pt={1}>
              <Typography>{t('Settlement')}</Typography>
              <NumberFormat value={rent.payment} />
            </CardRow>
          </Box>
        }
      >
        <span>
          <ResponsiveContainer height={50}>
            <BarChart layout="vertical" stackOffset="sign" data={data}>
              <XAxis
                type="number"
                hide={true}
                axisLine={false}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis dataKey="name" hide={true} type="category" />
              <Bar
                isAnimationActive={false}
                dataKey="payment"
                stackId="a"
                fill={theme.palette.success.main}
                background={{ fill: theme.palette.grey[200] }}
              />
              <Bar
                isAnimationActive={false}
                dataKey="balance"
                stackId="a"
                fill={theme.palette.warning.dark}
              />
              <Bar
                isAnimationActive={false}
                dataKey="currentRent"
                stackId="a"
                fill={theme.palette.warning.main}
              />
            </BarChart>
          </ResponsiveContainer>
        </span>
      </Tooltip>
      {!hideLeftToPay ? (
        <CardRow pb={2}>
          <Typography variant="caption">{t('Left to pay')}</Typography>
          <NumberFormat variant="caption" value={remainingRentToPay} />
        </CardRow>
      ) : null}
    </>
  );
});

export default BalanceBar;
