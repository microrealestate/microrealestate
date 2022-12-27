import { Box, Button, Divider, Tooltip, Typography } from '@material-ui/core';
import { CardRow, PageInfoCard } from '../Cards';
import { useCallback, useContext } from 'react';

import Hidden from '../HiddenSSRCompatible';
import HistoryIcon from '@material-ui/icons/History';
import { MobileButton } from '../MobileMenuButton';
import NumberFormat from '../NumberFormat';
import ReceiptIcon from '@material-ui/icons/Receipt';
import { StoreContext } from '../../store';
import useRentHistoryDialog from '../rents/RentHistoryDialog';
import useTranslation from 'next-translate/useTranslation';

export default function RentOverview() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [RentHistoryDialog, setOpenRentHistoryDialog] = useRentHistoryDialog();

  const handleRentHistory = useCallback(
    () => setOpenRentHistoryDialog(store.tenant.selected),
    [setOpenRentHistoryDialog, store.tenant.selected]
  );

  return (
    <>
      <RentHistoryDialog />

      <PageInfoCard
        Icon={ReceiptIcon}
        title={t('Rental')}
        Toolbar={
          !store.tenant.selected.stepperMode ? (
            <Tooltip
              title={
                !store.tenant.selected.properties
                  ? t('Contract details not filled')
                  : ''
              }
            >
              <span>
                <Hidden smDown>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<HistoryIcon />}
                    onClick={handleRentHistory}
                    disabled={!store.tenant.selected.properties}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {t('Rent schedule')}
                  </Button>
                </Hidden>
                <Hidden mdUp>
                  <MobileButton
                    variant="text"
                    Icon={HistoryIcon}
                    label={t('Rent schedule')}
                    onClick={handleRentHistory}
                    disabled={!store.tenant.selected.properties}
                  />
                </Hidden>
              </span>
            </Tooltip>
          ) : null
        }
      >
        <CardRow>
          <Typography color="textSecondary" noWrap>
            {t('Rent')}
          </Typography>
          <NumberFormat
            color="text.secondary"
            value={store.tenant.selected.rental}
          />
        </CardRow>
        <CardRow>
          <Typography color="textSecondary" noWrap>
            {t('Expenses')}
          </Typography>
          <NumberFormat
            color="text.secondary"
            value={store.tenant.selected.expenses}
          />
        </CardRow>
        {store.tenant.selected.discount > 0 ? (
          <CardRow>
            <Typography color="textSecondary" noWrap>
              {t('Discount')}
            </Typography>
            <NumberFormat
              color="text.secondary"
              value={store.tenant.selected.discount * -1}
            />
          </CardRow>
        ) : null}
        {store.tenant.selected.isVat && (
          <>
            <Box pb={1}>
              <Divider />
            </Box>
            <CardRow>
              <Typography color="textSecondary" noWrap>
                {t('Pre-tax total')}
              </Typography>
              <NumberFormat
                color="text.secondary"
                value={store.tenant.selected.preTaxTotal}
              />
            </CardRow>
            <CardRow>
              <Typography color="textSecondary" noWrap>
                {t('VAT')}
              </Typography>
              <NumberFormat
                color="text.secondary"
                value={store.tenant.selected.vat}
              />
            </CardRow>
          </>
        )}
        <Box pb={1}>
          <Divider />
        </Box>
        <CardRow>
          <Typography color="textSecondary" variant="h5" noWrap>
            {t('Total')}
          </Typography>
          <NumberFormat
            color="text.secondary"
            fontSize="h5.fontSize"
            value={store.tenant.selected.total}
          />
        </CardRow>
      </PageInfoCard>
    </>
  );
}
