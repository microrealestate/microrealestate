import { Box, Divider } from '@material-ui/core';

import { CardRow } from '../Cards';
import Hidden from '../HiddenSSRCompatible';
import NumberFormat from '../NumberFormat';
import useTranslation from 'next-translate/useTranslation';

export function getRentAmounts(rent) {
  const turnToNegative = (amount) => (amount !== 0 ? amount * -1 : 0);

  return {
    balance: rent.balance,
    absBalance: Math.abs(rent.balance),
    isDebitBalance: turnToNegative(rent.balance) < 0,
    newBalance: rent.newBalance,
    absNewBalance: Math.abs(rent.newBalance),
    isDebitNewBalance: rent.newBalance < 0,
    additionalCosts: rent.extracharge,
    rent: rent.totalWithoutBalanceAmount + rent.promo - rent.extracharge,
    discount: turnToNegative(rent.promo),
    payment: rent.payment,
    paymentReferences:
      rent.payments?.map(({ type, reference }) => ({
        type,
        reference,
      })) || [],
    totalAmount: rent.totalAmount,
  };
}

export function RentAmount({ label, amount, color, ...props }) {
  return (
    <>
      <Hidden xsDown>
        <Box display="flex" flexDirection="column">
          <Box align="right" fontSize="caption.fontSize" color="text.secondary">
            {label}
          </Box>
          <NumberFormat
            value={amount}
            align="right"
            fontSize="subtitle1.fontSize"
            withColor={!color}
            color={color}
            {...props}
          />
        </Box>
      </Hidden>
      <Hidden smUp>
        <Box display="flex" flexDirection="column" fontSize="caption.fontSize">
          <Box align="right" color="text.secondary">
            {label}
          </Box>
          <NumberFormat
            value={amount}
            align="right"
            withColor={!color}
            color={color}
            {...props}
          />
        </Box>
      </Hidden>
    </>
  );
}

export default function RentDetails({ rent }) {
  const { t } = useTranslation('common');

  const rentAmounts = getRentAmounts(rent);

  return (
    <>
      <CardRow>
        {rentAmounts.balance === 0
          ? t('Previous balance')
          : rentAmounts.isDebitBalance
            ? t('Previous debit balance')
            : t('Previous credit balance')}
        <NumberFormat
          value={rentAmounts.balance}
          debitColor={rentAmounts.isDebitBalance}
          creditColor={!rentAmounts.isDebitBalance}
        />
      </CardRow>
      <CardRow>
        {t('Rent')}
        <NumberFormat value={rentAmounts.rent} />
      </CardRow>
      <CardRow>
        {t('Additional costs')}
        <NumberFormat value={rentAmounts.additionalCosts} showZero={false} />
      </CardRow>
      <CardRow pb={1.5}>
        {t('Discount')}
        <NumberFormat value={rentAmounts.discount} showZero={false} />
      </CardRow>
      <Divider />
      <CardRow pt={1.5}>
        {t('Total to pay')}
        <NumberFormat value={rentAmounts.totalAmount} />
      </CardRow>
      <CardRow pb={1.5}>
        {t('Settlements')}
        <NumberFormat value={rentAmounts.payment} showZero={false} withColor />
      </CardRow>
      <Divider />
      <CardRow py={1.5}>
        {rentAmounts.newBalance === 0
          ? t('Balance')
          : rentAmounts.isDebitNewBalance
            ? t('Debit balance')
            : t('Credit balance')}
        <NumberFormat
          value={rentAmounts.newBalance}
          abs={true}
          debitColor={rentAmounts.isDebitNewBalance}
          creditColor={!rentAmounts.isDebitNewBalance}
        />
      </CardRow>
      <Divider />
      <CardRow pt={1.5}>
        <Box>
          <Box pb={1}>{t('Note')}</Box>
          <Box
            height={60}
            whiteSpace="pre"
            fontSize="caption.fontSize"
            color="text.secondary"
            overflow="scroll"
          >
            {rent.description}
          </Box>
        </Box>
      </CardRow>
    </>
  );
}
