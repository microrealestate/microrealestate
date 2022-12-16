import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  ClickAwayListener,
  Divider,
  Grid,
  Grow,
  IconButton,
  Link,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Toolbar,
  Tooltip,
  Typography,
} from '@material-ui/core';
import {
  Fragment,
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getRentAmounts, RentAmount } from './RentDetails';

import { downloadDocument } from '../../utils/fetch';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Hidden from '../HiddenSSRCompatible';
import moment from 'moment';
import { StoreContext } from '../../store';
import useNewPaymentDialog from '../payment/NewPaymentDialog';
import useTranslation from 'next-translate/useTranslation';

const TableToolbar = memo(function TableToolbar({
  selected = [],
  onSend = () => {},
}) {
  const { t } = useTranslation('common');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    }
  }

  const onClick = useCallback(
    (docName) => async (event) => {
      setSendingEmail(true);

      handleClose(event);
      await onSend(docName);

      setSendingEmail(false);
    },
    [onSend]
  );

  return (
    <Toolbar>
      <Grid container spacing={1} alignItems="center">
        {selected.length === 0 ? (
          <Grid item>
            <Typography variant="h6" component="div">
              {/* {t('Rents')} */}
            </Typography>
          </Grid>
        ) : (
          <>
            <Grid item xs={3}>
              <Box
                color="inherit"
                fontSize="caption.fontSize"
                whiteSpace="nowrap"
              >
                {t('{{count}} selected', { count: selected.length })}
              </Box>
            </Grid>
            <Grid item xs={9} style={{ textAlign: 'right' }}>
              <Button
                ref={anchorRef}
                disabled={sendingEmail}
                endIcon={
                  sendingEmail ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : (
                    <ExpandMoreIcon color="inherit" />
                  )
                }
                onClick={handleToggle}
              >
                {t('Send an email')}
              </Button>
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
                          <MenuItem onClick={onClick('rentcall')}>
                            {t('Send first notice')}
                          </MenuItem>
                          <MenuItem onClick={onClick('rentcall_reminder')}>
                            {t('Send second notice')}
                          </MenuItem>
                          <MenuItem onClick={onClick('rentcall_last_reminder')}>
                            {t('Send last notice')}
                          </MenuItem>
                          <MenuItem onClick={onClick('invoice')}>
                            {t('Send invoice')}
                          </MenuItem>
                        </MenuList>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>
            </Grid>
          </>
        )}
      </Grid>
    </Toolbar>
  );
});

function Reminder({ rent, ...boxProps }) {
  const { t } = useTranslation('common');

  let label;
  let sentDate;
  let color = 'text.secondary';
  let endpoint;
  let documentName;

  if (rent.emailStatus?.status?.rentcall) {
    sentDate = moment(rent.emailStatus.last.rentcall.sentDate);
    label = t('1st notice sent on {{date}}', {
      date: sentDate.format('L LT'),
    });
    documentName = `${rent.occupant.name}-${t('first notice')}.pdf`;
    endpoint = `/documents/rentcall/${rent.occupant._id}/${rent.term}`;
  }

  if (rent.emailStatus?.last?.rentcall_reminder) {
    sentDate = moment(rent.emailStatus.last.rentcall_reminder.sentDate);
    label = t('2nd notice sent on {{date}}', {
      date: sentDate.format('L LT'),
    });
    documentName = `${rent.occupant.name}-${t('second notice')}.pdf`;
    endpoint = `/documents/rentcall_reminder/${rent.occupant._id}/${rent.term}`;
  }

  if (rent.emailStatus?.last?.rentcall_last_reminder) {
    sentDate = moment(rent.emailStatus.last.rentcall_last_reminder.sentDate);
    label = t('Last notice sent on {{date}}', {
      date: sentDate.format('L LT'),
    });
    color = 'warning.dark';
    documentName = `${rent.occupant.name}-${t('last notice')}.pdf`;
    endpoint = `/documents/rentcall_last_reminder/${rent.occupant._id}/${rent.term}`;
  }

  if (rent.emailStatus?.last?.invoice) {
    sentDate = moment(rent.emailStatus.last.invoice.sentDate);
    label = t('Invoice sent on {{date}}', { date: sentDate.format('L LT') });
    color = 'success.dark';
    documentName = `${rent.occupant.name}-${t('invoice')}.pdf`;
    endpoint = `/documents/invoice/${rent.occupant._id}/${rent.term}`;
  }

  const visible = label && sentDate;

  const handleDownloadClick = useCallback(() => {
    downloadDocument({ endpoint, documentName });
  }, [documentName, endpoint]);

  return visible ? (
    <Box
      display="flex"
      alignItems="center"
      borderRadius="borderRadius"
      fontSize="caption.fontSize"
      color={color}
      {...boxProps}
    >
      <Link href="#" color="inherit" onClick={handleDownloadClick}>
        {label}
      </Link>
    </Box>
  ) : null;
}

function RentRow({ rent, isSelected, onSelect, onEdit }) {
  const { t } = useTranslation('common');
  const rentAmounts = getRentAmounts(rent);

  return (
    <Box key={rent._id} position="relative">
      <Box display="flex" alignItems="start" my={2}>
        <Box>
          {rent.occupant.hasContactEmails ? (
            <Checkbox
              color="default"
              checked={isSelected}
              onChange={onSelect(rent)}
              inputProps={{
                'aria-labelledby': rent.occupant.name,
              }}
              style={{ marginTop: -3 }}
            />
          ) : (
            <Tooltip title={t('No emails available for this tenant')}>
              <span>
                <Checkbox
                  onChange={onSelect(rent)}
                  inputProps={{
                    'aria-labelledby': rent.occupant.name,
                  }}
                  disabled
                />
              </span>
            </Tooltip>
          )}
        </Box>

        <Grid container>
          <Grid item xs={12} sm={4}>
            <Box
              display="flex"
              alignItems="center"
              height="100%"
              fontWeight="fontWeightBold"
              whiteSpace="nowrap"
            >
              {rent.occupant.name}
            </Box>
          </Grid>
          <Grid item xs={12} sm={8}>
            <Grid container>
              <Grid item xs={3}>
                <RentAmount
                  label={t('Rent')}
                  amount={rentAmounts.rent}
                  color="text.secondary"
                />
              </Grid>
              <Grid item xs={3}>
                <RentAmount
                  label={t('Balance')}
                  amount={rentAmounts.balance}
                  color="text.secondary"
                />
              </Grid>
              <Grid item xs={3}>
                <RentAmount
                  label={t('Rent due')}
                  amount={rentAmounts.totalAmount}
                  fontWeight={
                    rentAmounts.totalAmount > 0 ? 'fontWeightBold' : ''
                  }
                  color={
                    rentAmounts.totalAmount <= 0
                      ? 'text.secondary'
                      : 'warning.dark'
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <RentAmount
                  label={t('Settlement')}
                  amount={rent.payment}
                  showZero={false}
                  fontWeight={rentAmounts.payment > 0 ? 'fontWeightBold' : ''}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Box ml={2}>
          <IconButton aria-label="expand row" onClick={onEdit(rent)}>
            <EditIcon />
          </IconButton>
        </Box>
      </Box>
      <Reminder rent={rent} position="absolute" left={40} bottom={0} pb={0.5} />
      <Divider />
    </Box>
  );
}

function MobileRentRow({ rent, isSelected, onSelect, onEdit }) {
  const { t } = useTranslation('common');
  const rentAmounts = getRentAmounts(rent);

  return (
    <Box
      key={rent._id}
      display="flex"
      flexDirection="column"
      position="relative"
      mt={1}
    >
      <Box display="flex" alignItems="center">
        <Box>
          {rent.occupant.hasContactEmails ? (
            <Checkbox
              checked={isSelected}
              onChange={onSelect(rent)}
              inputProps={{
                'aria-labelledby': rent.occupant.name,
              }}
            />
          ) : (
            <Tooltip title={t('No emails available for this tenant')}>
              <span>
                <Checkbox
                  inputProps={{
                    'aria-labelledby': rent.occupant.name,
                  }}
                  disabled
                />
              </span>
            </Tooltip>
          )}
        </Box>
        <Box
          display="flex"
          alignItems="center"
          flexGrow={1}
          fontWeight="fontWeightBold"
          whiteSpace="nowrap"
        >
          {rent.occupant.name}
        </Box>
      </Box>
      <Box display="flex" alignItems="center" my={1}>
        <Box width="50%">
          <RentAmount
            label={t('Rent due')}
            amount={rentAmounts.totalAmount}
            fontWeight={rentAmounts.totalAmount > 0 ? 'fontWeightBold' : ''}
            color={
              rentAmounts.totalAmount <= 0 ? 'text.secondary' : 'warning.dark'
            }
          />
        </Box>
        <Box width="50%">
          <RentAmount
            label={t('Settlement')}
            amount={rent.payment}
            showZero={false}
            fontWeight={rentAmounts.payment > 0 ? 'fontWeightBold' : ''}
          />
        </Box>
        <Box ml={1}>
          <IconButton aria-label="expand row" onClick={onEdit(rent)}>
            <EditIcon />
          </IconButton>
        </Box>
      </Box>
      <Box px={1}>
        <Reminder rent={rent} />
      </Box>
      <Box mt={1}>
        <Divider />
      </Box>
    </Box>
  );
}

const RentTable = ({ rents }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [selected, setSelected] = useState([]);
  const [NewPaymentDialog, setOpenNewPaymentDialog] = useNewPaymentDialog();

  const onSelectAllClick = useCallback(
    (event) => {
      if (event.target.checked) {
        setSelected(
          rents.reduce((acc, rent) => {
            if (rent.occupant.hasContactEmails) {
              return [...acc, rent];
            }
            return acc;
          }, [])
        );
        return;
      }
      setSelected([]);
    },
    [rents]
  );

  const onSelectClick = useCallback(
    (rent) => (event) => {
      if (event.target.checked) {
        setSelected((selected) => [...selected, rent]);
        return;
      }
      setSelected((selected) => selected.filter((r) => r._id !== rent._id));
    },
    []
  );

  const onSend = useCallback(
    async (docName) => {
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
    },
    [store, selected, t]
  );

  const selectableRentNum = useMemo(
    () =>
      rents.reduce((acc, { _id, occupant: { hasContactEmails } }) => {
        if (hasContactEmails) {
          acc.push(_id);
        }
        return acc;
      }, []).length,
    [rents]
  );

  const handleEdit = useCallback(
    (rent) => () => {
      setOpenNewPaymentDialog(rent);
    },
    [setOpenNewPaymentDialog]
  );

  return (
    <>
      <NewPaymentDialog />

      <Paper>
        <TableToolbar selected={selected} onSend={onSend} />
        <Hidden smDown>
          <Box>
            <Checkbox
              color="default"
              indeterminate={
                selected.length > 0 && selected.length < selectableRentNum
              }
              checked={
                rents.length > 0 && selected.length === selectableRentNum
              }
              onChange={onSelectAllClick}
              inputProps={{ 'aria-label': 'select all rents' }}
            />
          </Box>
        </Hidden>
        <Hidden mdUp>
          <Box>
            <Checkbox
              color="default"
              indeterminate={
                selected.length > 0 && selected.length < selectableRentNum
              }
              checked={
                rents.length > 0 && selected.length === selectableRentNum
              }
              onChange={onSelectAllClick}
              inputProps={{ 'aria-label': 'select all rents' }}
            />
          </Box>
        </Hidden>

        <Divider />
        {rents.map((rent) => {
          const isItemSelected = selected.map((r) => r._id).includes(rent._id);
          return (
            <Fragment key={rent._id}>
              <Hidden smDown>
                <RentRow
                  rent={rent}
                  isSelected={isItemSelected}
                  onSelect={onSelectClick}
                  onEdit={handleEdit}
                />
              </Hidden>
              <Hidden mdUp>
                <MobileRentRow
                  rent={rent}
                  isSelected={isItemSelected}
                  onSelect={onSelectClick}
                  onEdit={handleEdit}
                />
              </Hidden>
            </Fragment>
          );
        })}
      </Paper>
    </>
  );
};

export default memo(RentTable);
