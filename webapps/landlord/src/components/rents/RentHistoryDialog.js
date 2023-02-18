import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Button,
  Dialog,
  Grid,
  IconButton,
  Toolbar,
  Typography,
} from '@material-ui/core';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import BoxWithHover from '../../components/BoxWithHover';
import DialogDefaultBackground from '../DialogDefaultBackground';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { getPeriod } from './RentPeriod';
import { Loading } from '@microrealestate/commonui/components';
import moment from 'moment';
import RentDetails from './RentDetails';
import { StoreContext } from '../../store';
import TransitionSlideUp from '../TransitionSlideUp';
import useDialog from '../../hooks/useDialog';
import useNewPaymentDialog from '../payment/NewPaymentDialog';
import useTranslation from 'next-translate/useTranslation';

function RentListItem({ rent, tenant, onClick }) {
  const { t } = useTranslation('common');

  return (
    <BoxWithHover
      p={2}
      height="100%"
      border={1}
      borderColor="divider"
      withCursor
      onClick={onClick}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box fontSize="h5.fontSize">
          {getPeriod(t, rent.term, tenant.occupant.frequency)}
        </Box>
        <IconButton onClick={onClick}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box mt={1}>
        <RentDetails rent={rent} />
      </Box>
    </BoxWithHover>
  );
}

function YearRentList({ tenant, year, onClick }) {
  const rents =
    tenant.rents?.filter(({ term }) => String(term).slice(0, 4) === year) || [];

  const handleClick = useCallback(
    ({ occupant }, rent) =>
      () => {
        onClick({ _id: occupant._id, ...rent, occupant });
      },
    [onClick]
  );

  return (
    <Grid container spacing={2}>
      {rents?.map((rent) => {
        return (
          <Grid item key={rent.term} xs={12} sm={12} md={6} lg={4} xl={2}>
            <RentListItem
              key={rent.term}
              rent={rent}
              tenant={tenant}
              onClick={handleClick(tenant, rent)}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}

function RentHistory({ tenantId }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState();
  const [rentYears, setRentYears] = useState([]);
  const [expandedYear, setExpandedYear] = useState(
    moment().startOf('month').format('YYYYMMDDHH').slice(0, 4)
  );

  const [NewPaymentDialog, setOpenNewPaymentDialog] = useNewPaymentDialog();

  const fetchTenantRents = useCallback(
    async (showLoadingAnimation = true) => {
      showLoadingAnimation && setLoading(true);
      const response = await store.rent.fetchTenantRents(tenantId);
      if (response.status !== 200) {
        store.pushToastMessage({
          message: t('Cannot get tenant information'),
          severity: 'error',
        });
      } else {
        const tenant = response.data;
        setTenant(tenant);
        setRentYears(
          Array.from(
            tenant.rents.reduce((acc, { term }) => {
              acc.add(String(term).slice(0, 4));
              return acc;
            }, new Set())
          )
        );
      }
      showLoadingAnimation && setLoading(false);
    },
    [store, t, tenantId]
  );

  useEffect(() => {
    fetchTenantRents();
  }, [t, tenantId, store.rent, store, fetchTenantRents]);

  const handleAccordionChange = (year) => (event, isExpanded) => {
    setExpandedYear(isExpanded ? year : false);
  };

  const handleClick = useCallback(
    (rent) => setOpenNewPaymentDialog(rent),

    [setOpenNewPaymentDialog]
  );

  const handleClose = useCallback(() => {
    fetchTenantRents(false);
  }, [fetchTenantRents]);

  return (
    <>
      <NewPaymentDialog onClose={handleClose} />
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

          {rentYears.map((year) => {
            return (
              <Accordion
                key={year}
                expanded={expandedYear === year}
                onChange={handleAccordionChange(year)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>{year}</Box>
                </AccordionSummary>
                {expandedYear === year ? (
                  <AccordionDetails>
                    <YearRentList
                      tenant={tenant}
                      year={year}
                      onClick={handleClick}
                    />
                  </AccordionDetails>
                ) : null}
              </Accordion>
            );
          })}
        </>
      )}
    </>
  );
}

function RentHistoryDialog({ open, setOpen }) {
  const { t } = useTranslation('common');
  const [showContent, setShowContent] = useState(false);

  const handleTransitionCompleted = useCallback(() => setShowContent(true), []);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  return (
    <Dialog
      fullScreen
      open={!!open}
      onClose={handleClose}
      TransitionComponent={TransitionSlideUp}
      TransitionProps={{ onEntered: handleTransitionCompleted }}
      PaperComponent={DialogDefaultBackground}
      keepMounted
    >
      <AppBar position="sticky">
        <Toolbar>
          <Box width="100%" display="flex" alignItems="center">
            <Box flexGrow={1}>
              <Typography variant="h6">{t('Rent schedule')}</Typography>
            </Box>
            <Box>
              <Button color="inherit" onClick={handleClose}>
                {t('Close')}
              </Button>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box py={2} px={3}>
        {showContent && open ? <RentHistory tenantId={open._id} /> : null}
      </Box>
    </Dialog>
  );
}

export default function useRentHistoryDialog() {
  return useDialog(RentHistoryDialog);
}
