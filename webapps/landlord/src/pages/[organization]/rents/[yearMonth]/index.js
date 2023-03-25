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
import { useCallback, useContext, useMemo, useRef, useState } from 'react';

import Alert from '../../../../components/Alert';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Hidden from '../../../../components/HiddenSSRCompatible';
import { MobileButton } from '../../../../components/MobileMenuButton';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import Page from '../../../../components/Page';
import PeriodPicker from '../../../../components/PeriodPicker';
import { RentOverview } from '../../../../components/rents/RentOverview';
import RentTable from '../../../../components/rents/RentTable';
import SearchFilterBar from '../../../../components/SearchFilterBar';
import SendIcon from '@material-ui/icons/Send';
import { StoreContext } from '../../../../store';
import useFillStore from '../../../../hooks/useFillStore';
import usePagination from '../../../../hooks/usePagination';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

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
  //       message: t('Email delivery service cannot send emails'),
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
          message: t('Email delivery service cannot send emails'),
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

function Navbar({ onChange, ...props }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const rentPeriod = moment(router.query.yearMonth, 'YYYY.MM');

  return (
    <Box display="flex" alignItems="center" {...props}>
      <Hidden smDown>
        <Box color="text.secondary" fontSize="h5.fontSize" mr={1}>
          {t('Rents')}
        </Box>
      </Hidden>

      <PeriodPicker
        format="MMMM YYYY"
        period="month"
        value={rentPeriod}
        onChange={onChange}
      />
    </Box>
  );
}

const SearchBar = observer(function SearchBar() {
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
    (status = [], searchText) => {
      let queryString = '';
      const statusIds = status.filter(({ id }) => id).map(({ id }) => id);
      if (searchText || statusIds.length) {
        queryString = `?search=${encodeURIComponent(
          searchText
        )}&status=${encodeURIComponent(statusIds.join(','))}`;
      }
      router.push(
        `/${store.organization.selected.name}/rents/${store.rent.periodAsString}${queryString}`,
        undefined,
        { shallow: true }
      );
      store.rent.setFilters({ status: statusIds, searchText });
    },
    [router, store.rent, store.organization.selected.name]
  );

  return (
    <SearchFilterBar
      searchText={store.rent.filters.searchText}
      selectedIds={store.rent.filters.status}
      statusList={filters}
      onSearch={handleSearch}
    />
  );
});

async function fetchData(store, router) {
  const { yearMonth, search, status } = router.query;
  let rentPeriod = moment(yearMonth, 'YYYY.MM', true);
  if (rentPeriod.isValid()) {
    store.rent.setPeriod(rentPeriod);
    store.rent.setFilters({
      searchText: search,
      status: status?.split(',') || [],
    });
    return await store.rent.fetch();
  }
  return [];
}

const Rents = observer(function Rents() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [rentSelected, setRentSelected] = useState([]);
  const [pageData, setPageData] = useState([]);
  const [Pagination] = usePagination(20, store.rent.filteredItems, setPageData);
  const [fetching] = useFillStore(fetchData, [router]);

  const handlePeriodChange = useCallback(
    async (period) => {
      store.rent.setPeriod(period);
      await router.push(
        `/${store.organization.selected.name}/rents/${store.rent.periodAsString}`
      );
    },
    [router, store.rent, store.organization.selected.name]
  );

  const handlePageChange = useCallback(() => {
    setRentSelected([]);
  }, []);

  return (
    <Page
      loading={fetching}
      ActionBar={
        <ActionToolbar selected={rentSelected} setSelected={setRentSelected} />
      }
    >
      <Navbar onChange={handlePeriodChange} />
      <Hidden smDown>
        <Box mb={4}>
          <RentOverview width="100%" />
        </Box>
      </Hidden>
      <Hidden smDown>
        <Box display="flex" alignItems="end" justifyContent="space-between">
          <SearchBar />
          <Pagination onPageChange={handlePageChange} />
        </Box>
      </Hidden>
      <Hidden mdUp>
        <SearchBar />
        <Box display="flex" justifyContent="center">
          <Pagination onPageChange={handlePageChange} />
        </Box>
      </Hidden>
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
        rents={pageData}
        selected={rentSelected}
        setSelected={setRentSelected}
      />
      <Box display="flex" justifyContent="center">
        <Pagination />
      </Box>
    </Page>
  );
});

export default withAuthentication(Rents);
