import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { useCallback, useContext, useEffect, useState } from 'react';

import { downloadDocument } from '../../../utils/fetch';
import { EmptyIllustration } from '../../../components/Illustrations';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import moment from 'moment';
import { NumberFormat } from '../../../utils/numberformat';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PeriodPicker from '../../../components/PeriodPicker';
import PropertyIcon from '../../../components/properties/PropertyIcon';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import { StoreContext } from '../../../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';
import { withStyles } from '@material-ui/core/styles';

const PeriodToolbar = () => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const year = router.query.year || moment().year();

  const onChange = useCallback(
    async (period) => {
      await router.push(
        `/${store.organization.selected.name}/accounting/${period.format(
          'YYYY'
        )}`
      );
    },
    [router, store.organization.selected.name]
  );

  return (
    <Grid container alignItems="center" spacing={2}>
      <Grid item>
        <Typography color="textSecondary" variant="h5" noWrap={true}>
          {t('Accounting')}
        </Typography>
      </Grid>
      <Grid item>
        <PeriodPicker
          format="YYYY"
          period="year"
          value={year}
          onChange={onChange}
        />
      </Grid>
    </Grid>
  );
};

const ACCORDION_STATES = {};
const TenantsTableWrapper = ({
  id,
  title,
  defaultExpanded = false,
  hasData = true,
  onClick,
  children,
}) => {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(
    ACCORDION_STATES[id] !== undefined ? ACCORDION_STATES[id] : defaultExpanded
  );

  const onChange = useCallback(
    (e, expanded) => {
      ACCORDION_STATES[id] = expanded;
      setExpanded(expanded);
    },
    [id]
  );

  return (
    <Accordion expanded={expanded} onChange={onChange}>
      <AccordionSummary
        id={id}
        expandIcon={<ExpandMoreIcon />}
        aria-controls={title}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Box width={350}>
              <Typography variant="h5" noWrap={true}>
                {title}
              </Typography>
            </Box>
          </Grid>
          {hasData && (
            <Grid item>
              <Tooltip
                title={t('download as csv')}
                aria-label={t('download as csv')}
              >
                <IconButton onClick={onClick}>
                  <SaveAltIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};

const PropertiesList = ({ properties }) => {
  return properties.map(({ _id, name, type }) => (
    <Box key={_id} display="flex" alignItems="center" mb={1}>
      <PropertyIcon type={type} />
      <Typography noWrap={true}>{name}</Typography>
    </Box>
  ));
};

const SettlementList = ({ month, tenantId, settlements }) => {
  const { t } = useTranslation('common');

  return settlements
    ? settlements.map((settlement, index) => {
        const { date, amount, type } = settlement;
        return amount > 0 ? (
          <Box key={`${tenantId}_${month}_${index}`} alignItems="center" mb={1}>
            <Typography variant="body2" noWrap={true}>
              {moment(date).format('L')}
            </Typography>
            <Typography variant="body2" noWrap={true}>
              {t(type[0].toUpperCase() + type.slice(1))}
            </Typography>
            <NumberFormat value={amount} variant="body2" withColor />
          </Box>
        ) : null;
      })
    : null;
};

const StyledTable = withStyles(() => {
  return {
    root: { border: '1px solid rgba(224, 224, 224, 1)' },
  };
})(Table);

const StyledTableCell = withStyles(() => {
  return {
    root: {
      verticalAlign: 'top',
      borderLeft: '1px solid rgba(224, 224, 224, 1)',
    },
  };
})(TableCell);

const IncomingTenants = ({ id, defaultExpanded, onCSVClick }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const hasData = !!store.accounting?.data?.incomingTenants?.length;

  return (
    <TenantsTableWrapper
      id={id}
      title={t('Incoming tenants')}
      defaultExpanded={defaultExpanded}
      hasData={hasData}
      onClick={onCSVClick}
    >
      {hasData ? (
        <TableContainer>
          <StyledTable aria-label="incoming tenants">
            <TableHead>
              <TableRow>
                <StyledTableCell>{t('Name')}</StyledTableCell>
                <StyledTableCell align="left">{t('Property')}</StyledTableCell>
                <StyledTableCell align="center">
                  {t('Start date')}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {t('End date')}
                </StyledTableCell>
                <StyledTableCell align="right">{t('Deposit')}</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {store.accounting.data.incomingTenants.map((tenant) => (
                <TableRow key={tenant._id} hover>
                  <StyledTableCell component="th" scope="row">
                    <Typography noWrap={true}>{tenant.name}</Typography>
                  </StyledTableCell>
                  <StyledTableCell align="left">
                    <PropertiesList properties={tenant.properties} />
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    {moment(tenant.beginDate).format('L')}
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    {moment(tenant.endDate).format('L')}
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={tenant.guaranty !== 0 ? tenant.guaranty : null}
                    />
                  </StyledTableCell>
                </TableRow>
              ))}
            </TableBody>
          </StyledTable>
        </TableContainer>
      ) : (
        <EmptyIllustration label={t('No data found')} />
      )}
    </TenantsTableWrapper>
  );
};

const OutgoingTenants = ({ id, onCSVClick }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const hasData = !!store.accounting?.data?.outgoingTenants?.length;

  return (
    <TenantsTableWrapper
      id={id}
      title={t('Outgoing tenants')}
      onClick={onCSVClick}
      hasData={hasData}
    >
      {hasData ? (
        <TableContainer>
          <StyledTable aria-label="incoming tenants">
            <TableHead>
              <TableRow>
                <StyledTableCell>{t('Name')}</StyledTableCell>
                <StyledTableCell align="left">{t('Property')}</StyledTableCell>
                <StyledTableCell align="center">
                  {t('Start date')}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {t('Termination date')}
                </StyledTableCell>
                <StyledTableCell align="right">{t('Deposit')}</StyledTableCell>
                <StyledTableCell align="right">
                  {t('Deposit reimbursement')}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {t('Last rent balance')}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {t('Final balance')}
                </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {store.accounting.data.outgoingTenants.map((tenant) => (
                <TableRow key={tenant._id} hover>
                  <StyledTableCell component="th" scope="row">
                    <Typography noWrap={true}>{tenant.name}</Typography>
                  </StyledTableCell>
                  <StyledTableCell align="left">
                    <PropertiesList properties={tenant.properties} />
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    {moment(tenant.beginDate).format('L')}
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    {tenant.terminationDate
                      ? moment(tenant.terminationDate).format('L')
                      : moment(tenant.endDate).format('L')}
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={tenant.guaranty !== 0 ? tenant.guaranty : null}
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={
                        tenant.guarantyPayback !== 0
                          ? tenant.guarantyPayback
                          : null
                      }
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={tenant.balance !== 0 ? tenant.balance : null}
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={
                        tenant.finalBalance !== 0 ? tenant.finalBalance : null
                      }
                      withColor
                    />
                  </StyledTableCell>
                </TableRow>
              ))}
            </TableBody>
          </StyledTable>
        </TableContainer>
      ) : (
        <EmptyIllustration />
      )}
    </TenantsTableWrapper>
  );
};

const months = moment.localeData().months();
const Settlements = ({ id, onCSVClick }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const hasData = !!store.accounting?.data?.settlements?.length;
  return (
    <TenantsTableWrapper
      id={id}
      title={t('Settlements')}
      hasData={hasData}
      onClick={onCSVClick}
    >
      {hasData ? (
        <TableContainer
          style={{
            transform: 'rotateX(180deg)',
          }}
        >
          <StyledTable
            aria-label="incoming tenants"
            style={{
              transform: 'rotateX(180deg)',
            }}
          >
            <TableHead>
              <TableRow>
                <StyledTableCell>{t('Name')}</StyledTableCell>
                {months.map((m) => (
                  <StyledTableCell key={m} align="center">
                    {m}
                  </StyledTableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {store.accounting.data.settlements.map((settlement) => (
                <TableRow key={settlement.tenantId} hover>
                  <StyledTableCell component="th" scope="row">
                    <Typography noWrap={true}>{settlement.tenant}</Typography>
                    <Typography noWrap={true}>
                      {moment(settlement.beginDate).format('L')} -{' '}
                      {moment(settlement.endDate).format('L')}
                    </Typography>
                  </StyledTableCell>
                  {months.map((m, index) => {
                    return (
                      <StyledTableCell
                        key={`${settlement.tenantId}_${index}`}
                        align="center"
                      >
                        <SettlementList
                          tenantId={settlement.tenantId}
                          month={index}
                          settlements={settlement.settlements[index]}
                        />
                      </StyledTableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </StyledTable>
        </TableContainer>
      ) : (
        <EmptyIllustration />
      )}
    </TenantsTableWrapper>
  );
};

const Accounting = observer(() => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await store.accounting.fetch(router.query.year);
      setLoading(false);
    })();
  }, [store, router.query.year]);

  const getSettlementsAsCsv = useCallback(
    async (e) => {
      e.stopPropagation();
      downloadDocument({
        endpoint: `/csv/settlements/${router.query.year}`,
        documentName: t('Settlements - {{year}}.csv', {
          year: router.query.year,
        }),
      });
    },
    [t, router.query.year]
  );

  const getIncomingTenantsAsCsv = useCallback(
    async (e) => {
      e.stopPropagation();
      downloadDocument({
        endpoint: `/csv/tenants/incoming/${router.query.year}`,
        documentName: t('Incoming tenants - {{year}}.csv', {
          year: router.query.year,
        }),
      });
    },
    [t, router.query.year]
  );

  const getOutgoingTenantsAsCsv = useCallback(
    async (e) => {
      e.stopPropagation();
      downloadDocument({
        endpoint: `/csv/tenants/outgoing/${router.query.year}`,
        documentName: t('Outgoing tenants - {{year}}.csv', {
          year: router.query.year,
        }),
      });
    },
    [t, router.query.year]
  );

  return (
    <Page NavBar={<PeriodToolbar loading={loading} />}>
      {store.accounting?.data?.incomingTenants?.length ||
      store.accounting?.data?.outgoingTenants?.length ||
      store.accounting?.data?.settlements?.length ? (
        <>
          <IncomingTenants
            id="incoming-tenants"
            defaultExpanded={true}
            onCSVClick={getIncomingTenantsAsCsv}
          />
          <OutgoingTenants
            id="outgoing-tenants"
            onCSVClick={getOutgoingTenantsAsCsv}
          />
          <Settlements id="settlements" onCSVClick={getSettlementsAsCsv} />
        </>
      ) : (
        <EmptyIllustration label={t('No data found')} />
      )}
    </Page>
  );
});

export default withAuthentication(Accounting);
