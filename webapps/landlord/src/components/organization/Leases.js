import { Box, Paper, Switch, TableHead, Typography } from '@material-ui/core';
import React, { useCallback, useContext, useState } from 'react';

import { ADMIN_ROLE } from '../../store/User';
import { FormSection } from '../Form';
import Link from '../Link';
import NewLeaseDialog from './NewLeaseDialog';
import { RestrictButton } from '../RestrictedComponents';
import { StoreContext } from '../../store';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { nanoid } from 'nanoid';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const Leases = observer(({ setError }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [openNewLeaseDialog, setOpenNewLeaseDialog] = useState(false);

  const onLeaseChange = useCallback(
    async (active, lease) => {
      lease.active = active;
      const { status } = await store.lease.update(lease);

      if (status !== 200) {
        switch (status) {
          case 422:
            return setError(t('Some fields are missing'));
          case 403:
            return setError(t('You are not allowed to update the contract'));
          case 404:
            return setError(t('Contract is not found'));
          case 409:
            return setError(t('The contract already exists'));
          default:
            return setError(t('Something went wrong'));
        }
      }
    },
    [setError, store.lease]
  );

  const onCreateLease = useCallback(
    async (lease) => {
      store.lease.setSelected(lease);
      await router.push(
        `/${store.organization.selected.name}/settings/lease/${lease._id}`
      );
    },
    [store.lease, store.organization.selected.name]
  );

  return (
    <FormSection label={t('Manage contracts')}>
      <Box py={2}>
        <RestrictButton
          variant="contained"
          color="primary"
          onClick={() => setOpenNewLeaseDialog(true)}
          onlyRoles={[ADMIN_ROLE]}
        >
          {t('New contract')}
        </RestrictButton>
      </Box>
      <Paper variant="outlined" square>
        <Table aria-label="contract table">
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography>{t('Contract')}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{t('Number of terms')}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{t('Description')}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>{t('Active')}</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(store.lease.items || []).map((lease) => {
              return (
                <TableRow key={nanoid()} size="small">
                  <TableCell>
                    {lease.system ? (
                      <Typography noWrap>{t(lease.name)}</Typography>
                    ) : (
                      <Link
                        href={`/${store.organization.selected.name}/settings/lease/${lease._id}`}
                      >
                        <Typography noWrap>{lease.name}</Typography>
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    {lease.system || !lease.numberOfTerms ? (
                      <Typography noWrap>{t('Custom')}</Typography>
                    ) : (
                      <Typography noWrap>
                        {t('{{numberOfTerms}} {{timeRange}}', {
                          numberOfTerms: lease.numberOfTerms,
                          timeRange: lease.timeRange,
                        })}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {lease.system ? (
                      <Typography>{t(lease.description)}</Typography>
                    ) : (
                      <Typography>{lease.description}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      color={lease.active ? 'primary' : 'default'}
                      checked={lease.active}
                      onChange={(evt) =>
                        onLeaseChange(evt.target.checked, lease)
                      }
                      disabled={!!lease.numberOfTerms === false}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
      <NewLeaseDialog
        open={openNewLeaseDialog}
        setOpen={setOpenNewLeaseDialog}
        onConfirm={onCreateLease}
      />
    </FormSection>
  );
});

export default Leases;
