import { Box, Paper, Typography } from '@material-ui/core';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import Loading from '../Loading';
import { NumberFormat } from '../../utils/numberformat';
import RequestError from '../RequestError';
import { StoreContext } from '../../store';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { getPeriod } from './RentPeriod';
import moment from 'moment';
import { nanoid } from 'nanoid';
import useTranslation from 'next-translate/useTranslation';

const RentHistory = ({ tenantId }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [tenant, setTenant] = useState();
  const selectedRowRef = useRef();
  const selectedTerm = useMemo(
    () => moment().startOf('month').format('YYYYMMDDHH'),
    []
  );

  useEffect(() => {
    const fetchTenantRents = async () => {
      setLoading(true);
      const response = await store.rent.fetchTenantRents(tenantId);
      if (response.status !== 200) {
        setError(t('Cannot get tenant information'));
      } else {
        setTenant(response.data);
      }
      setLoading(false);
    };

    fetchTenantRents();
  }, []);

  useEffect(() => {
    if (!loading) {
      selectedRowRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [tenant, loading]);

  return (
    <>
      {loading && <Loading />}
      {error && <RequestError error={error} />}
      {!loading && !error && (
        <>
          <Box pb={4}>
            <Typography variant="h5">{tenant.occupant.name}</Typography>
            {tenant.occupant.beginDate && tenant.occupant.endDate && (
              <Typography color="textSecondary" variant="body2">
                {t('Contract from {{beginDate}} to {{endDate}}', {
                  beginDate: moment(
                    tenant.occupant.beginDate,
                    'DD/MM/YYYY'
                  ).format('L'),
                  endDate: moment(tenant.occupant.endDate, 'DD/MM/YYYY').format(
                    'L'
                  ),
                })}
              </Typography>
            )}
          </Box>
          <Paper variant="outlined" square>
            <Table stickyHeader aria-label="rents history table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography>{t('Period')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>{t('Rent')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>{t('Additional costs')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>{t('Discounts')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>{t('Settlement')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>{t('Balance')}</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenant?.rents?.map((rent) => {
                  const isSelected = String(rent.term) === selectedTerm;
                  return (
                    <TableRow
                      key={nanoid()}
                      hover
                      ref={isSelected ? selectedRowRef : null}
                      selected={isSelected}
                      size="small"
                    >
                      <TableCell>
                        {getPeriod(t, rent.term, tenant.occupant.frequency)}
                      </TableCell>
                      <TableCell align="right">
                        <NumberFormat
                          variant="body1"
                          value={
                            rent.totalWithoutBalanceAmount +
                            rent.promo -
                            rent.extracharge
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        {rent.extracharge > 0 && (
                          <NumberFormat
                            variant="body1"
                            value={rent.extracharge}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {rent.promo > 0 && (
                          <NumberFormat variant="body1" value={rent.promo} />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {rent.payment > 0 && (
                          <NumberFormat
                            variant="body1"
                            value={rent.payment}
                            withColor
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <NumberFormat variant="body1" value={rent.newBalance} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </>
  );
};

export default RentHistory;
