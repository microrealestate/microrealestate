import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../../store';
import { useCallback, useContext, useMemo, useRef, useState } from 'react';

import Alert from '../../../../components/Alert';
import { EmptyIllustration } from '../../../../components/Illustrations';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Hidden from '../../../../components/HiddenSSRCompatible';
import { isServer } from '../../../../utils';
import { MobileButton } from '../../../../components/MobileMenuButton';
import moment from 'moment';
import Page from '../../../../components/Page';
import RentTable from '../../../../components/rents/RentTable';
import SearchFilterBar from '../../../../components/SearchFilterBar';
import SendIcon from '@material-ui/icons/Send';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

function SearchBar() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);

  const filters = useMemo(
    () => [
      { id: '', label: t('All') },
      { id: 'notpaid', label: t('Not paid') },
      { id: 'partiallypaid', label: t('Partially paid') },
      { id: 'paid', label: t('Paid') },
    ],
    [t]
  );

  const handleSearch = useCallback(
    (status, searchText) => {
      let queryString = '';
      if (searchText || status) {
        queryString = `?search=${encodeURIComponent(
          searchText
        )}&status=${encodeURIComponent(status)}`;
      }
      router.push(
        `/${store.organization.selected.name}/rents/${store.rent.periodAsString}${queryString}`,
        undefined,
        { shallow: true }
      );
      store.rent.setFilters({ status, searchText });
    },
    [router, store.rent, store.organization.selected.name]
  );

  return (
    <SearchFilterBar
      filters={filters}
      defaultValue={store.rent.filters}
      onSearch={handleSearch}
    />
  );
}

function ActionToolbar({ selected, setSelected }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  // const [sendingEvictionNotice, setSendingEvictionNotice] = useState(false);
  const [sendingPaymentNotice, setSendingPaymentNotice] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  // const [ConfirmDialog, setShowConfirmDlg, showConfirmDlg] = useConfirmDialog();

  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, []);

  const handleClose = useCallback((event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  }, []);

  const handleListKeyDown = useCallback((event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    }
  }, []);

  // const handleShowConfirmDlg = useCallback(
  //   () => setShowConfirmDlg(true),
  //   [setShowConfirmDlg]
  // );

  // const handleConfirm = useCallback(async () => {
  //   setSendingEvictionNotice(true);

  //   const sendStatus = await store.rent.sendEmail({
  //     document: 'eviction',
  //     tenantIds: [selected[0]._id],
  //     terms: [selected[0].term],
  //   });

  //   if (sendStatus !== 200) {
  //     // TODO check error code to show a more detail error message
  //     return store.pushToastMessage({
  //       message: t('Email service cannot send emails'),
  //       severity: 'error',
  //     });
  //   }

  //   const response = await store.rent.fetch();
  //   if (response.status !== 200) {
  //     // TODO check error code to show a more detail error message
  //     return store.pushToastMessage({
  //       message: t('Cannot fetch rents from server'),
  //       severity: 'error',
  //     });
  //   }

  //   setSelected([]);

  //   setSendingEvictionNotice(false);
  // }, [selected, setSelected, store, t]);

  const handleClickInvoicePaymentNotice = useCallback(
    (docName) => async (event) => {
      docName === 'invoice'
        ? setSendingInvoice(true)
        : setSendingPaymentNotice(true);

      handleClose(event);
      const sendStatus = await store.rent.sendEmail({
        document: docName,
        tenantIds: selected.map((r) => r._id),
        terms: selected.map((r) => r.term),
      });
      if (sendStatus !== 200) {
        // TODO check error code to show a more detail error message
        return store.pushToastMessage({
          message: t('Email service cannot send emails'),
          severity: 'error',
        });
      }

      const response = await store.rent.fetch();
      if (response.status !== 200) {
        // TODO check error code to show a more detail error message
        return store.pushToastMessage({
          message: t('Cannot fetch rents from server'),
          severity: 'error',
        });
      }

      setSelected([]);

      docName === 'invoice'
        ? setSendingInvoice(false)
        : setSendingPaymentNotice(false);
    },
    [handleClose, selected, setSelected, store, t]
  );

  return (
    <>
      <Box display="flex" flexDirection="column" position="relative">
        <Hidden smDown>
          {selected?.length > 0 ? (
            <Box
              color="inherit"
              fontSize="caption.fontSize"
              whiteSpace="nowrap"
              position="absolute"
              bottom={-20}
              right={0}
            >
              {t('{{count}} tenants selected', { count: selected.length })}
            </Box>
          ) : null}
        </Hidden>
        <Box display="flex" justifyContent="end" alignItems="center">
          {/* <Button
            variant="contained"
            color="secondary"
            ref={anchorRef}
            disabled={
              !store.organization.canSendEmails ||
              !selected?.length ||
              selected.length > 1 ||
              sendingEvictionNotice
            }
            startIcon={<SendIcon />}
            endIcon={
              sendingEvictionNotice ? <CircularProgress size={20} /> : null
            }
            onClick={handleShowConfirmDlg}
          >
            {t('Send an eviction notice')}
          </Button> */}

          <Box display="flex">
            <Hidden smDown>
              <ButtonGroup variant="contained">
                <Button
                  disabled={
                    !store.organization.canSendEmails ||
                    !selected?.length ||
                    sendingInvoice
                  }
                  startIcon={<SendIcon />}
                  endIcon={
                    sendingInvoice ? <CircularProgress size={20} /> : null
                  }
                  onClick={handleClickInvoicePaymentNotice('invoice')}
                >
                  {t('Send an invoice')}
                </Button>
                <Button
                  ref={anchorRef}
                  disabled={
                    !store.organization.canSendEmails ||
                    !selected?.length ||
                    sendingPaymentNotice
                  }
                  startIcon={<SendIcon />}
                  endIcon={
                    sendingPaymentNotice ? (
                      <CircularProgress size={20} />
                    ) : (
                      <ExpandMoreIcon />
                    )
                  }
                  onClick={handleToggle}
                >
                  {t('Send a payment notice')}
                </Button>
              </ButtonGroup>
            </Hidden>
            <Hidden mdUp>
              <ButtonGroup variant="text">
                <MobileButton
                  label={t('Send an invoice')}
                  Icon={SendIcon}
                  disabled={
                    !store.organization.canSendEmails ||
                    !selected?.length ||
                    sendingInvoice
                  }
                  onClick={handleClickInvoicePaymentNotice('invoice')}
                />
                <MobileButton
                  ref={anchorRef}
                  label={t('Send a payment notice')}
                  Icon={SendIcon}
                  disabled={
                    !store.organization.canSendEmails ||
                    !selected?.length ||
                    sendingPaymentNotice
                  }
                  endIcon={<ExpandMoreIcon />}
                  onClick={handleToggle}
                />
              </ButtonGroup>
            </Hidden>
            <Popper open={open} anchorEl={anchorRef.current} transition>
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin:
                      placement === 'bottom' ? 'center top' : 'center bottom',
                  }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={handleClose}>
                      <MenuList
                        autoFocusItem={open}
                        onKeyDown={handleListKeyDown}
                      >
                        <MenuItem
                          onClick={handleClickInvoicePaymentNotice('rentcall')}
                        >
                          {t('First payment notice')}
                        </MenuItem>
                        <MenuItem
                          onClick={handleClickInvoicePaymentNotice(
                            'rentcall_reminder'
                          )}
                        >
                          {t('Second payment notice')}
                        </MenuItem>
                        <MenuItem
                          onClick={handleClickInvoicePaymentNotice(
                            'rentcall_last_reminder'
                          )}
                        >
                          {t('Last payment notice')}
                        </MenuItem>
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </Box>
        </Box>
      </Box>
      {/* {showConfirmDlg ? (
        <ConfirmDialog
          title={t('Are you sure to send an eviction notice to this tenant?')}
          subTitle={selected?.[0].occupant.name}
          onConfirm={handleConfirm}
        />
      ) : null} */}
    </>
  );
}

function Rents() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [rentSelected, setRentSelected] = useState([]);

  const handlePeriodChange = useCallback(
    async (period) => {
      store.rent.setPeriod(period);
      await router.push(
        `/${store.organization.selected.name}/rents/${store.rent.periodAsString}`
      );
    },
    [router, store.rent, store.organization.selected.name]
  );

  return (
    <Page
      title={t('Rents')}
      SearchBar={<SearchBar />}
      ActionToolbar={
        <ActionToolbar selected={rentSelected} setSelected={setRentSelected} />
      }
    >
      {store.rent?.filteredItems.length ? (
        <>
          {!store.organization.canSendEmails ? (
            <Box mb={1}>
              <Alert
                elevation={1}
                severity="warning"
                title={t(
                  'Unable to send documents by email without configuring the mail service in Settings page'
                )}
              />
            </Box>
          ) : null}
          <RentTable
            selected={rentSelected}
            setSelected={setRentSelected}
            onPeriodChange={handlePeriodChange}
          />
        </>
      ) : (
        <EmptyIllustration label={t('No rents found')} />
      )}
    </Page>
  );
}

Rents.getInitialProps = async (context) => {
  const store = isServer() ? context.store : getStoreInstance();

  if (isServer()) {
    const { yearMonth, search, status } = context.query;
    const rentPeriod = moment(yearMonth, 'YYYY.MM', true);
    if (!rentPeriod.isValid()) {
      return { error: { statusCode: 404 } };
    }
    store.rent.setPeriod(rentPeriod);
    store.rent.setFilters({ searchText: search, status });
  }

  const { status } = await store.rent.fetch();
  if (status !== 200) {
    return { error: { statusCode: status } };
  }

  return {
    initialState: {
      store: isServer() ? toJS(store) : store,
    },
  };
};

export default withAuthentication(Rents);
