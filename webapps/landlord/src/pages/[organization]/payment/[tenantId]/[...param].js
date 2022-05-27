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
  useMediaQuery,
} from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../../store';
import { TabPanel, useTabChangeHelper } from '../../../../components/Tabs';
import { useCallback, useContext } from 'react';
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
import { observer } from 'mobx-react-lite';
import Page from '../../../../components/Page';
import { PageInfoCard } from '../../../../components/Cards';

import PaymentForm from '../../../../components/payment/PaymentForm';
import ReceiptIcon from '@material-ui/icons/Receipt';
import RentDetails from '../../../../components/rents/RentDetails';
import RentHistory from '../../../../components/rents/RentHistory';
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
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const router = useRouter();
  const {
    param: [term, backPage, backPath],
  } = router.query;

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
        console.error(error);
        store.pushToastMessage({
          message: t('Something went wrong'),
          severity: 'error',
        });
      }
    },
    [store, term, t]
  );

  return (
    <Page
      title={store.rent.selected.occupant.name}
      ActionToolbar={
        isMobile ? (
          <>
            <FullScreenDialogButton
              variant="contained"
              buttonLabel={t('Rent schedule')}
              Icon={HistoryIcon}
              dialogTitle={t('Rent schedule')}
              cancelButtonLabel={t('Close')}
              showCancel
            >
              <RentHistory tenantId={store.rent.selected.occupant._id} />
            </FullScreenDialogButton>
            <SendRentEmailMenu
              tenant={store.rent.selected.occupant}
              terms={[store.rent.selected.term]}
              period={store.rent.period}
            />
          </>
        ) : null
      }
      NavBar={
        <BreadcrumbBar
          backPath={backPath}
          backPage={backPage}
          currentPage={store.rent.selected.occupant.name}
        />
      }
    >
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
                    Icon={HistoryIcon}
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
                  <RentDetails rent={store.rent.selected} />
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
