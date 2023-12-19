import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import { useCallback, useContext, useState } from 'react';

import { downloadDocument } from '../../../utils/fetch';
import { EmptyIllustration } from '../../../components/Illustrations';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import moment from 'moment';
import NumberFormat from '../../../components/NumberFormat';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PeriodPicker from '../../../components/PeriodPicker';
import PropertyIcon from '../../../components/properties/PropertyIcon';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import { StoreContext } from '../../../store';
import useFillStore from '../../../hooks/useFillStore';
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
        <Typography color="textSecondary" variant="h5" noWrap>
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
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <Box>
            <Typography variant="h5" noWrap>
              {title}
            </Typography>
          </Box>
          {hasData && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SaveAltIcon />}
              onClick={onClick}
            >
              {t('Download as csv file')}
            </Button>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};

const PropertiesList = ({ properties }) => {
  return properties.map(({ _id, name, type }) => (
    <Box
      key={_id}
      display="flex"
      alignItems="center"
      mb={1}
      fontSize="caption.fontSize"
      color="text.secondary"
    >
      <PropertyIcon type={type} />
      <Box whiteSpace="nowrap">{name}</Box>
    </Box>
  ));
};

const SettlementList = ({ month, tenantId, settlements }) => {
  const { t } = useTranslation('common');

  return settlements
    ? settlements.map((settlement, index) => {
      const { date, amount, type } = settlement;
      return amount > 0 ? (
        <Box
          key={`${tenantId}_${month}_${index}`}
          alignItems="center"
          mb={1}
          fontSize="caption.fontSize"
          color="text.secondary"
        >
          <Box whiteSpace="nowrap">{moment(date).format('L')}</Box>
          <Box whiteSpace="nowrap">
            {t(type[0].toUpperCase() + type.slice(1))}
          </Box>
          <NumberFormat value={amount} withColor fontSize="body2.fontSize" />
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
                    <Box fontSize="body2.fontSize">{tenant.name}</Box>
                  </StyledTableCell>
                  <StyledTableCell align="left">
                    <PropertiesList properties={tenant.properties} />
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Box fontSize="caption.fontSize" color="text.secondary">
                      {moment(tenant.beginDate).format('L')}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Box fontSize="caption.fontSize" color="text.secondary">
                      {moment(tenant.endDate).format('L')}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={tenant.guaranty}
                      fontSize="body2.fontSize"
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
                    <Box fontSize="body2.fontSize" whiteSpace="nowrap">
                      {tenant.name}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell align="left">
                    <PropertiesList properties={tenant.properties} />
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Box fontSize="caption.fontSize" color="text.secondary">
                      {moment(tenant.beginDate).format('L')}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Box fontSize="caption.fontSize" color="text.secondary">
                      {tenant.terminationDate
                        ? moment(tenant.terminationDate).format('L')
                        : moment(tenant.endDate).format('L')}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={tenant.guaranty}
                      fontSize="caption.fontSize"
                      color="text.secondary"
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={tenant.guarantyPayback}
                      showZero={false}
                      fontSize="caption.fontSize"
                      color="text.secondary"
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={tenant.balance}
                      showZero={false}
                      fontSize="caption.fontSize"
                      color="text.secondary"
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <NumberFormat
                      value={tenant.finalBalance}
                      showZero={false}
                      fontSize="body2.fontSize"
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
const Settlements = ({ id, onCSVClick, onDownloadYearInvoices }) => {
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
                    <Box mb={2}>
                      <Box whiteSpace="nowrap" fontSize="body2.fontSize">
                        {settlement.tenant}
                      </Box>
                      <Box
                        whiteSpace="nowrap"
                        fontSize="caption.fontSize"
                        color="text.secondary"
                      >
                        {moment(settlement.beginDate).format('L')} -{' '}
                        {moment(settlement.endDate).format('L')}
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SaveAltIcon />}
                      onClick={onDownloadYearInvoices({
                        _id: settlement.tenantId,
                        name: settlement.tenant,
                      })}
                    >
                      <Box
                        whiteSpace="nowrap"
                        fontSize="caption.fontSize"
                        lineHeight="normal"
                        letterSpacing={0}
                      >
                        {t('Download invoices')}
                      </Box>
                    </Button>
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

async function fetchData(store, router) {
  return await store.accounting.fetch(router.query.year);
}

const Accounting = observer(() => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [fetching] = useFillStore(fetchData, [router]);

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

  const getYearInvoices = useCallback(
    (tenant) => () => {
      downloadDocument({
        endpoint: `/documents/invoice/${tenant._id}/${router.query.year}`,
        documentName: `${tenant.name}-${router.query.year}-${t('invoice')}.pdf`,
      });
    },
    [router.query.year, t]
  );

  return (
    <Page loading={fetching} ActionBar={<PeriodToolbar />}>
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
              <Settlements
                id="settlements"
                onCSVClick={getSettlementsAsCsv}
                onDownloadYearInvoices={getYearInvoices}
              />
            </>
          ) : (
            <EmptyIllustration label={t('No data found')} />
          )}
    </Page>
  );
});

export default withAuthentication(Accounting);
