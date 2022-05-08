import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import DownloadLink from '../DownloadLink';
import moment from 'moment';
import { NumberFormat } from '../../utils/numberformat';
import SearchFilterBar from '../SearchFilterBar';
import { StoreContext } from '../../store';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import useTranslation from 'next-translate/useTranslation';

const TableToolbar = memo(function TableToolbar({
  selected = [],
  onSend = () => {},
}) {
  const { t } = useTranslation('common');
  const [sendingEmail, setSendingEmail] = useState({
    rentcall: '',
    rentcall_reminder: '',
    rentcall_last_reminder: '',
    invoice: '',
  });

  const onClick = useCallback(
    async (docName) => {
      setSendingEmail({
        rentcall: docName === 'rentcall' ? 'sending' : 'disabled',
        rentcall_reminder:
          docName === 'rentcall_reminder' ? 'sending' : 'disabled',
        rentcall_last_reminder:
          docName === 'rentcall_last_reminder' ? 'sending' : 'disabled',
        invoice: docName === 'invoice' ? 'sending' : 'disabled',
      });

      await onSend(docName);

      setSendingEmail({
        rentcall: '',
        rentcall_reminder: '',
        rentcall_last_reminder: '',
        invoice: '',
      });
    },
    [onSend]
  );

  return (
    <Toolbar>
      <Grid container spacing={1} alignItems="center">
        {selected.length === 0 ? (
          <Grid item>
            <Typography variant="h6" component="div">
              {t('Rents')}
            </Typography>
          </Grid>
        ) : (
          <>
            <Grid item xs={3}>
              <Typography
                color="inherit"
                variant="subtitle1"
                component="div"
                noWrap
              >
                {t('{{count}} selected', { count: selected.length })}
              </Typography>
            </Grid>
            <Grid item xs={9}>
              <Grid
                container
                spacing={1}
                alignItems="center"
                justifyContent="flex-end"
              >
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={sendingEmail.rentcall !== ''}
                    endIcon={
                      sendingEmail.rentcall === 'sending' ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null
                    }
                    onClick={() => onClick('rentcall')}
                  >
                    {t('Send first notice')}
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={sendingEmail.rentcall_reminder !== ''}
                    endIcon={
                      sendingEmail.rentcall_reminder === 'sending' ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null
                    }
                    onClick={() => onClick('rentcall_reminder')}
                  >
                    {t('Send second notice')}
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={sendingEmail.rentcall_last_reminder !== ''}
                    endIcon={
                      sendingEmail.rentcall_last_reminder === 'sending' ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null
                    }
                    onClick={() => onClick('rentcall_last_reminder')}
                  >
                    {t('Send last notice')}
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={sendingEmail.invoice !== ''}
                    endIcon={
                      sendingEmail.invoice === 'sending' ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null
                    }
                    onClick={() => onClick('invoice')}
                  >
                    {t('Send invoice')}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </Toolbar>
  );
});

const RentTable = () => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [filteredRents, setFilteredRents] = useState(store.rent.items);
  const [selected, setSelected] = useState([]);
  const [filterSearchText, setFilterSearchText] = useState({
    searchText: '',
    filter: '',
  });
  const theme = useTheme();

  useEffect(() => {
    setFilteredRents(
      store.rent.items
        .filter(({ status }) => {
          if (!filterSearchText.filter) {
            return true;
          }
          if (status === filterSearchText.filter) {
            return true;
          }
          return false;
        })
        .filter(({ occupant: { name } }) => {
          if (filterSearchText.searchText) {
            return (
              name
                .toLowerCase()
                .indexOf(filterSearchText.searchText.toLowerCase()) !== -1
            );
          }
          return true;
        })
    );
  }, [store.rent?.items, filterSearchText]);

  const onSelectAllClick = useCallback(
    (event) => {
      if (event.target.checked) {
        setSelected(
          filteredRents.reduce((acc, rent) => {
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
    [filteredRents]
  );

  const onSelectClick = useCallback((event, rent) => {
    if (event.target.checked) {
      setSelected((selected) => [...selected, rent]);
      return;
    }
    setSelected((selected) => selected.filter((r) => r._id !== rent._id));
  }, []);

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
      filteredRents.reduce((acc, { _id, occupant: { hasContactEmails } }) => {
        if (hasContactEmails) {
          acc.push(_id);
        }
        return acc;
      }, []).length,
    [filteredRents]
  );

  const filters = useMemo(
    () => [
      { id: '', label: t('All') },
      { id: 'notpaid', label: t('Not paid') },
      { id: 'partiallypaid', label: t('Partially paid') },
      { id: 'paid', label: t('Paid') },
    ],
    [t]
  );

  return (
    <>
      <Box pt={2} pb={1} width={600}>
        <SearchFilterBar
          filters={filters}
          onSearch={useCallback(
            (filter, searchText) => setFilterSearchText({ filter, searchText }),
            []
          )}
        />
      </Box>
      <Paper variant="outlined" square>
        <TableToolbar selected={selected} onSend={onSend} />
        <Table stickyHeader aria-label="rent table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="default"
                  indeterminate={
                    selected.length > 0 && selected.length < selectableRentNum
                  }
                  checked={
                    filteredRents.length > 0 &&
                    selected.length === selectableRentNum
                  }
                  onChange={onSelectAllClick}
                  inputProps={{ 'aria-label': 'select all rents' }}
                />
              </TableCell>
              <TableCell>
                <Typography>{t('Tenant')}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography>{t('Rent due')}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>{t('Status')}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>{t('First notice')}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>{t('Second notice')}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>{t('Last notice')}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>{t('Invoice')}</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRents.map((rent) => {
              const isItemSelected = selected
                .map((r) => r._id)
                .includes(rent._id);
              const contactEmails = rent.occupant.contactEmails.join(', ');
              return (
                <TableRow
                  key={rent._id}
                  hover
                  selected={isItemSelected}
                  size="small"
                >
                  <TableCell padding="checkbox">
                    {rent.occupant.hasContactEmails ? (
                      <Checkbox
                        color="default"
                        checked={isItemSelected}
                        onChange={(event) => onSelectClick(event, rent)}
                        inputProps={{ 'aria-labelledby': rent.occupant.name }}
                      />
                    ) : (
                      <Tooltip title={t('No emails available for this tenant')}>
                        <span>
                          <Checkbox
                            onChange={(event) => onSelectClick(event, rent)}
                            inputProps={{
                              'aria-labelledby': rent.occupant.name,
                            }}
                            disabled
                          />
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography noWrap>{rent.occupant.name}</Typography>
                    <Typography variant="caption" noWrap>
                      {contactEmails}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <NumberFormat
                      variant="body1"
                      value={rent.totalToPay > 0 ? rent.totalToPay : 0}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {['paid', 'partialypaid'].includes(rent.status) ? (
                      <Chip
                        label={
                          rent.status === 'paid'
                            ? t('Paid')
                            : t('Partially paid')
                        }
                        color="primary"
                        style={{
                          backgroundColor:
                            rent.status === 'paid'
                              ? theme.palette.success.main
                              : theme.palette.warning.main,
                          width: 100,
                        }}
                        size="small"
                      />
                    ) : (
                      <Chip
                        label={t('Not paid')}
                        color="primary"
                        style={{
                          backgroundColor: theme.palette.error.main,
                          width: 100,
                        }}
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {rent.emailStatus && rent.emailStatus.status.rentcall ? (
                      <DownloadLink
                        tooltipText={t('sent on {{datetime}}', {
                          datetime: moment(
                            rent.emailStatus.last.rentcall.sentDate
                          ).format('LLLL'),
                        })}
                        url={`/documents/rentcall/${rent.occupant._id}/${rent.term}`}
                        documentName={`${rent.occupant.name}-${t(
                          'first notice'
                        )}.pdf`}
                        withIcon
                      />
                    ) : null}
                  </TableCell>
                  <TableCell align="center">
                    {rent.emailStatus &&
                    rent.emailStatus.status.rentcall_reminder ? (
                      <DownloadLink
                        tooltipText={t('sent on {{datetime}}', {
                          datetime: moment(
                            rent.emailStatus.last.rentcall_reminder.sentDate
                          ).format('LLLL'),
                        })}
                        url={`/documents/rentcall_reminder/${rent.occupant._id}/${rent.term}`}
                        documentName={`${rent.occupant.name}-${t(
                          'second notice'
                        )}.pdf`}
                        withIcon
                      />
                    ) : null}
                  </TableCell>
                  <TableCell align="center">
                    {rent.emailStatus &&
                    rent.emailStatus.status.rentcall_last_reminder ? (
                      <DownloadLink
                        tooltipText={t('sent on {{datetime}}', {
                          datetime: moment(
                            rent.emailStatus.last.rentcall_last_reminder
                              .sentDate
                          ).format('LLLL'),
                        })}
                        url={`/documents/rentcall_last_reminder/${rent.occupant._id}/${rent.term}`}
                        documentName={`${rent.occupant.name}-${t(
                          'last notice'
                        )}.pdf`}
                        withIcon
                      />
                    ) : null}
                  </TableCell>
                  <TableCell align="center">
                    {rent.emailStatus && rent.emailStatus.status.invoice ? (
                      <DownloadLink
                        tooltipText={t('sent on {{datetime}}', {
                          datetime: moment(
                            rent.emailStatus.last.invoice.sentDate
                          ).format('LLLL'),
                        })}
                        url={`/documents/invoice/${rent.occupant._id}/${rent.term}`}
                        documentName={`${rent.occupant.name}-${t(
                          'invoice'
                        )}.pdf`}
                        withIcon
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
};

export default RentTable;
