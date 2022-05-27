import {
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@material-ui/core';
import React, {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import getConfig from 'next/config';
import { getPeriod } from './RentPeriod';
import Loading from '../Loading';
import moment from 'moment';
import RentDetails from './RentDetails';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

const {
  publicRuntimeConfig: { BASE_PATH },
} = getConfig();

const RentListItem = React.forwardRef(function RentListItem(
  { rent, tenant /*, selected*/ },
  ref
) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const backPath = `/${store.organization.selected.name}/rents/${moment(
    rent.term,
    'YYYYMMDDHH'
  ).format('YYYY.MM')}`;
  const backPage = t('Rents of {{date}}', {
    date: moment(rent.term, 'YYYYMMDDHHMM').format('MMM YYYY'),
  });
  return (
    <Paper>
      <ListItem
        button
        component="a"
        ref={ref}
        // selected={selected}
        style={{
          marginBottom: 20,
        }}
        href={`${BASE_PATH}/${store.organization.selected.locale}/${
          store.organization.selected.name
        }/payment/${tenant.occupant._id}/${rent.term}/${encodeURI(
          backPage
        )}/${encodeURIComponent(backPath)}`}
      >
        <ListItemText
          primary={
            <>
              <Box>
                <Typography variant="h5" component="div">
                  {getPeriod(t, rent.term, tenant.occupant.frequency)}
                </Typography>
              </Box>
              <Box mt={1} px={1}>
                <RentDetails rent={rent} />
              </Box>
              {!!rent.description && (
                <Box mt={2} px={1}>
                  <Typography color="textSecondary">{t('Note')}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {rent.description}
                  </Typography>
                </Box>
              )}
            </>
          }
        />
      </ListItem>
    </Paper>
  );
});

const RentHistory = ({ tenantId }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [loading, setLoading] = useState(true);
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
        store.pushToastMessage({
          message: t('Cannot get tenant information'),
          severity: 'error',
        });
      } else {
        setTenant(response.data);
      }
      setLoading(false);
    };

    fetchTenantRents();
  }, [t, tenantId, store.rent, store]);

  useEffect(() => {
    if (!loading) {
      selectedRowRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [tenant, loading]);

  return (
    <>
      {loading ? (
        <Loading fullScreen />
      ) : (
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

          <List component="nav" disablePadding aria-labelledby="rent-history">
            {tenant?.rents?.map((rent) => {
              const isSelected = String(rent.term) === selectedTerm;
              return (
                <RentListItem
                  key={rent.term}
                  ref={isSelected ? selectedRowRef : null}
                  rent={rent}
                  tenant={tenant}
                  selected={isSelected}
                />
              );
            })}
          </List>
        </>
      )}
    </>
  );
};

export default memo(RentHistory);
