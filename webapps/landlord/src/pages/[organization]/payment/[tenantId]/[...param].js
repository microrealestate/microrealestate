import {
  Box,
  Divider,
  Grid,
  Hidden,
  List,
  ListItem,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@material-ui/core';
import { CardRow, PageInfoCard } from '../../../../components/Cards';
import { getStoreInstance, StoreContext } from '../../../../store';
import { TabPanel, useTabChangeHelper } from '../../../../components/Tabs';
import { useCallback, useContext, useMemo, useState } from 'react';

import AdditionalCostDiscountForm from '../../../../components/payment/AdditionalCostDiscountForm';
import BalanceBar from '../../../../components/rents/BalanceBar';
import BreadcrumbBar from '../../../../components/BreadcrumbBar';
import DownloadLink from '../../../../components/DownloadLink';
import { EmptyIllustration } from '../../../../components/Illustrations';
import FullScreenDialogButton from '../../../../components/FullScreenDialogButton';
import HistoryIcon from '@material-ui/icons/History';
import InternalNoteForm from '../../../../components/payment/InternalNoteForm';
import { isServer } from '../../../../utils';
import moment from 'moment';
import { NumberFormat } from '../../../../utils/numberformat';
import { observer } from 'mobx-react-lite';
import Page from '../../../../components/Page';
import PaymentForm from '../../../../components/payment/PaymentForm';
import ReceiptIcon from '@material-ui/icons/Receipt';
import RentHistory from '../../../../components/rents/RentHistory';
import RequestError from '../../../../components/RequestError';
import SendIcon from '@material-ui/icons/Send';
import SendRentEmailMenu from '../../../../components/rents/SendRentEmailMenu';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';
import { withStyles } from '@material-ui/core/styles';

const StyledListItem = withStyles(() => ({
  root: {
    paddingLeft: 0,
    paddingRight: 0,
  },
}))(ListItem);

const _rentDetails = (rent) => {
  const turnToNegative = (amount) => (amount !== 0 ? amount * -1 : 0);

  return {
    balance: turnToNegative(rent.balance),
    newBalance: rent.newBalance,
    additionalCosts: turnToNegative(rent.extracharge),
    rent: turnToNegative(
      rent.totalWithoutBalanceAmount + rent.promo - rent.extracharge
    ),
    discount: rent.promo,
    payment: rent.payment,
    totalAmount: rent.totalAmount,
  };
};

export const PaymentBalance = () => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const rentDetails = useMemo(
    () => _rentDetails(store.rent.selected),
    [store.rent.selected]
  );

  return (
    <>
      <CardRow>
        <Typography color="textSecondary" noWrap>
          {t('Prev balance')}
        </Typography>
        <NumberFormat
          color="textSecondary"
          value={rentDetails.balance}
          noWrap
          withColor
        />
      </CardRow>
      <CardRow>
        <Typography color="textSecondary" noWrap>
          {t('Rent')}
        </Typography>
        <NumberFormat color="textSecondary" value={rentDetails.rent} noWrap />
      </CardRow>
      <CardRow>
        <Typography color="textSecondary" noWrap>
          {t('Additional costs')}
        </Typography>
        <NumberFormat
          color="textSecondary"
          value={rentDetails.additionalCosts}
          noWrap
        />
      </CardRow>
      <CardRow pb={1.5}>
        <Typography color="textSecondary" noWrap>
          {t('Discount')}
        </Typography>
        <NumberFormat
          color="textSecondary"
          value={rentDetails.discount}
          noWrap
        />
      </CardRow>
      <Divider />
      <CardRow pt={1.5}>
        <Typography color="textSecondary" noWrap>
          {t('Total to pay')}
        </Typography>
        <NumberFormat
          color="textSecondary"
          value={rentDetails.totalAmount}
          noWrap
        />
      </CardRow>
      <CardRow pb={1.5}>
        <Typography color="textSecondary" noWrap>
          {t('Settlements')}
        </Typography>
        <NumberFormat
          color="textSecondary"
          value={rentDetails.payment}
          noWrap
          withColor
        />
      </CardRow>
      <Divider />
      <CardRow pt={1.5}>
        <Typography color="textSecondary" noWrap>
          {rentDetails.newBalance < 0
            ? t('Debit balance')
            : t('Credit balance')}
        </Typography>
        <NumberFormat
          color="textSecondary"
          value={rentDetails.newBalance}
          noWrap
          withColor
        />
      </CardRow>
    </>
  );
};

const hashes = ['payments', 'costanddiscount', 'internalnote'];

const PaymentTabs = ({ onSubmit }) => {
  const { t } = useTranslation('common');
  const { handleTabChange, tabSelectedIndex, tabsReady } =
    useTabChangeHelper(hashes);

  return (
    tabsReady && (
      <>
        <Tabs
          variant="scrollable"
          value={tabSelectedIndex}
          onChange={handleTabChange}
          aria-label="Tenant tabs"
        >
          <Tab label={t('Settlements')} wrapped />
          <Tab label={t('Additional cost and discount')} wrapped />
          <Tab label={t('Internal note')} wrapped />
        </Tabs>
        <TabPanel value={tabSelectedIndex} index={0}>
          <PaymentForm onSubmit={onSubmit} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={1}>
          <AdditionalCostDiscountForm onSubmit={onSubmit} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={2}>
          <InternalNoteForm onSubmit={onSubmit} />
        </TabPanel>
      </>
    )
  );
};

const RentPayment = observer(() => {
  console.log('RentPayment functional component');
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const {
    param: [term, backPage, backPath],
  } = router.query;
  const [error /*setError*/] = useState('');

  const onSubmit = useCallback(
    async (paymentPart) => {
      const payment = {
        _id: store.rent.selected._id,
        month: store.rent.selected.month,
        year: store.rent.selected.year,
        payments: toJS(store.rent.selected.payments),
        extracharge: store.rent.selected.extracharge,
        noteextracharge: store.rent.selected.noteextracharge,
        promo: store.rent.selected.promo,
        notepromo: store.rent.selected.notepromo,
        description: store.rent.selected.description,
        ...paymentPart,
      };

      try {
        await store.rent.pay(term, payment);
      } catch (error) {
        //TODO manage errors
        console.error(error);
      }
    },
    [term, store.rent]
  );

  return (
    <Page
      NavBar={
        <BreadcrumbBar
          backPath={backPath}
          backPage={backPage}
          currentPage={store.rent.selected.occupant.name}
        />
      }
    >
      <RequestError error={error} />
      <Grid container spacing={5}>
        <Grid item xs={12} md={7} lg={8}>
          <Hidden mdUp>
            <Box pb={4}>
              <BalanceBar
                rent={store.rent.selected}
                hideTooltip={true}
                hideLeftToPay={false}
              />
            </Box>
          </Hidden>

          <Paper>
            <PaymentTabs onSubmit={onSubmit} />
          </Paper>
        </Grid>
        <Hidden smDown>
          <Grid item xs={12} md={5} lg={4}>
            <Box pb={4}>
              <PageInfoCard
                Icon={ReceiptIcon}
                title={t('Rent')}
                Toolbar={
                  <FullScreenDialogButton
                    variant="contained"
                    buttonLabel={t('Rent schedule')}
                    size="small"
                    startIcon={<HistoryIcon />}
                    dialogTitle={t('Rent schedule')}
                    cancelButtonLabel={t('Close')}
                    showCancel
                  >
                    <RentHistory tenantId={store.rent.selected.occupant._id} />
                  </FullScreenDialogButton>
                }
              >
                <Box pb={1}>
                  <BalanceBar rent={store.rent.selected} hideTooltip={true} />
                </Box>
                <Divider />
                <Box pt={1}>
                  <PaymentBalance />
                </Box>
              </PageInfoCard>
            </Box>

            <PageInfoCard
              Icon={SendIcon}
              title={t('Emails sent')}
              Toolbar={
                <SendRentEmailMenu
                  tenant={store.rent.selected.occupant}
                  terms={[store.rent.selected.term]}
                  period={store.rent.period}
                  // TODO: handle errors
                  onError={() => {}}
                />
              }
            >
              {store.rent.selected.emailStatus ? (
                <List>
                  {store.rent.selected.emailStatus.status?.rentcall && (
                    <StyledListItem>
                      <DownloadLink
                        label={t('1st notice sent on {{datetime}}', {
                          datetime: moment(
                            store.rent.selected.emailStatus.last.rentcall
                              .sentDate
                          ).format('L hh:mm'),
                        })}
                        url={`/documents/rentcall/${store.rent.selected.occupant._id}/${store.rent.selected.term}`}
                        documentName={`${store.rent.selected.occupant.name}-${t(
                          'first notice'
                        )}.pdf`}
                        variant="body2"
                        color="textSecondary"
                      />
                    </StyledListItem>
                  )}

                  {store.rent.selected.emailStatus.status
                    ?.rentcall_reminder && (
                    <StyledListItem>
                      <DownloadLink
                        label={t('2nd notice sent on {{datetime}}', {
                          datetime: moment(
                            store.rent.selected.emailStatus.last
                              .rentcall_reminder.sentDate
                          ).format('L hh:mm'),
                        })}
                        url={`/documents/rentcall_reminder/${store.rent.selected.occupant._id}/${store.rent.selected.term}`}
                        documentName={`${store.rent.selected.occupant.name}-${t(
                          'second notice'
                        )}.pdf`}
                        variant="body2"
                        color="textSecondary"
                      />
                    </StyledListItem>
                  )}
                  {store.rent.selected.emailStatus.status
                    ?.rentcall_last_reminder && (
                    <StyledListItem>
                      <DownloadLink
                        label={t('Last notice sent on {{datetime}}', {
                          datetime: moment(
                            store.rent.selected.emailStatus.last
                              .rentcall_last_reminder.sentDate
                          ).format('L hh:mm'),
                        })}
                        url={`/documents/rentcall_last_reminder/${store.rent.selected.occupant._id}/${store.rent.selected.term}`}
                        documentName={`${store.rent.selected.occupant.name}-${t(
                          'last notice'
                        )}.pdf`}
                        variant="body2"
                        color="textSecondary"
                      />
                    </StyledListItem>
                  )}
                  {store.rent.selected.emailStatus.status?.invoice && (
                    <StyledListItem>
                      <DownloadLink
                        label={t('Invoice sent on {{datetime}}', {
                          datetime: moment(
                            store.rent.selected.emailStatus.last.invoice
                              .sentDate
                          ).format('L hh:mm'),
                        })}
                        url={`/documents/invoice/${store.rent.selected.occupant._id}/${store.rent.selected.term}`}
                        documentName={`${store.rent.selected.occupant.name}-${t(
                          'invoice'
                        )}.pdf`}
                        variant="body2"
                        color="textSecondary"
                      />
                    </StyledListItem>
                  )}
                </List>
              ) : (
                <EmptyIllustration label={t('No emails sent')} />
              )}
            </PageInfoCard>
          </Grid>
        </Hidden>
      </Grid>
    </Page>
  );
});

RentPayment.getInitialProps = async (context) => {
  console.log('RentPayment.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();
  const {
    tenantId,
    param: [term],
  } = context.query;

  const { status, data } = await store.rent.fetchOneTenantRent(tenantId, term);
  if (status !== 200) {
    return { error: { statusCode: status } };
  }

  store.rent.setSelected(data);

  const props = {
    initialState: {
      store: toJS(store),
    },
  };
  return props;
};

export default withAuthentication(RentPayment);
