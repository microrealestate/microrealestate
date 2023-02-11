import {
  Box,
  Checkbox,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Tooltip,
} from '@material-ui/core';
import { Fragment, memo, useCallback, useContext, useMemo } from 'react';
import { getRentAmounts, RentAmount } from './RentDetails';

import BoxWithHover from '../../components/BoxWithHover';
import { downloadDocument } from '../../utils/fetch';
import EditIcon from '@material-ui/icons/Edit';
import { EmptyIllustration } from '../Illustrations';
import Hidden from '../HiddenSSRCompatible';
import HistoryIcon from '@material-ui/icons/History';
import moment from 'moment';
import { StoreContext } from '../../store';
import useNewPaymentDialog from '../payment/NewPaymentDialog';
import useRentHistoryDialog from './RentHistoryDialog';
import useTranslation from 'next-translate/useTranslation';

const Reminder = memo(function Reminder({ rent, ...boxProps }) {
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
});

const RentRow = memo(function RentRow({
  rent,
  isSelected,
  onSelect,
  onEdit,
  onHistory,
}) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const rentAmounts = getRentAmounts(rent);

  return (
    <Box key={rent._id} position="relative">
      <Box display="flex" alignItems="center" py={2}>
        <Box>
          {rent.occupant.hasContactEmails ? (
            <Checkbox
              color="default"
              checked={isSelected}
              disabled={!store.organization.canSendEmails}
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
        <Box ml={2} mr={0.5}>
          <IconButton size="small" onClick={onEdit(rent)}>
            <EditIcon />
          </IconButton>
        </Box>
        <Box mr={1}>
          <IconButton size="small" onClick={onHistory(rent)}>
            <HistoryIcon />
          </IconButton>
        </Box>
      </Box>
      <Reminder rent={rent} position="absolute" left={40} bottom={0} pb={0.5} />
      <Divider />
    </Box>
  );
});

const MobileRentRow = memo(function MobileRentRow({
  rent,
  isSelected,
  onSelect,
  onEdit,
  onHistory,
}) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const rentAmounts = getRentAmounts(rent);

  return (
    <Box
      key={rent._id}
      display="flex"
      flexDirection="column"
      position="relative"
      pt={1}
    >
      <Box display="flex" alignItems="center">
        <Box>
          {rent.occupant.hasContactEmails ? (
            <Checkbox
              checked={isSelected}
              disabled={!store.organization.canSendEmails}
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
        <Box ml={4}>
          <IconButton onClick={onEdit(rent)}>
            <EditIcon />
          </IconButton>
        </Box>
        <Box>
          <IconButton onClick={onHistory(rent)}>
            <HistoryIcon />
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
});

function RentTable({ rents = [], selected, setSelected }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const [NewPaymentDialog, setOpenNewPaymentDialog] = useNewPaymentDialog();
  const [RentHistoryDialog, setOpenRentHistoryDialog] = useRentHistoryDialog();

  const selectableRentNum = useMemo(() => {
    return rents.reduce((acc, { _id, occupant: { hasContactEmails } }) => {
      if (hasContactEmails) {
        acc.push(_id);
      }
      return acc;
    }, []).length;
  }, [rents]);

  const onSelectAllClick = useCallback(
    (event) => {
      let rentSelected = [];
      if (event.target.checked) {
        rentSelected = rents.filter((rent) => rent.occupant.hasContactEmails);
      }
      setSelected?.(rentSelected);
    },
    [rents, setSelected]
  );

  const onSelectClick = useCallback(
    (rent) => (event) => {
      let rentSelected = [];
      if (event.target.checked) {
        rentSelected = [...selected, rent];
      } else {
        rentSelected = selected.filter((r) => r._id !== rent._id);
      }
      setSelected?.(rentSelected);
    },
    [selected, setSelected]
  );

  const handleEdit = useCallback(
    (rent) => () => {
      setOpenNewPaymentDialog(rent);
    },
    [setOpenNewPaymentDialog]
  );

  const handleHistory = useCallback(
    (rent) => () => {
      setOpenRentHistoryDialog(rent.occupant);
    },
    [setOpenRentHistoryDialog]
  );

  return (
    <>
      <NewPaymentDialog />
      <RentHistoryDialog />

      <Paper>
        <Box p={2}>
          {rents.length ? (
            <>
              <Box display="flex" alignItems="center">
                <Checkbox
                  color="default"
                  indeterminate={
                    selected.length > 0 && selected.length < selectableRentNum
                  }
                  checked={selected.length === selectableRentNum}
                  disabled={!store.organization.canSendEmails}
                  onChange={onSelectAllClick}
                  inputProps={{
                    'aria-label': 'select all rents',
                  }}
                />
              </Box>

              <Divider />
              {rents.map((rent) => {
                const isItemSelected = selected
                  .map((r) => r._id)
                  .includes(rent._id);
                return (
                  <BoxWithHover key={rent._id}>
                    <Hidden smDown>
                      <RentRow
                        rent={rent}
                        isSelected={isItemSelected}
                        onSelect={onSelectClick}
                        onEdit={handleEdit}
                        onHistory={handleHistory}
                      />
                    </Hidden>
                    <Hidden mdUp>
                      <MobileRentRow
                        rent={rent}
                        isSelected={isItemSelected}
                        onSelect={onSelectClick}
                        onEdit={handleEdit}
                        onHistory={handleHistory}
                      />
                    </Hidden>
                  </BoxWithHover>
                );
              })}
            </>
          ) : (
            <EmptyIllustration label={t('No rents found')} />
          )}
        </Box>
      </Paper>
    </>
  );
}

export default RentTable;
