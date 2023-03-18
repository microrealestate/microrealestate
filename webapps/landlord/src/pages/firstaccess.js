import { Box, Container, Paper, Typography } from '@material-ui/core';
import React, { useContext } from 'react';

import Landlord from '../components/organization/LandlordForm';
import { observer } from 'mobx-react-lite';
import Page from '../components/Page';
import { setOrganizationId } from '../utils/fetch';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import Welcome from '../components/Welcome';
import { withAuthentication } from '../components/Authentication';

const FirstAccess = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  const onSubmit = async (organization) => {
    try {
      // set current user as administrator of the org
      organization.members = [
        {
          name: `${store.user.firstName} ${store.user.lastName}`,
          email: store.user.email,
          role: 'administrator',
          registered: true,
        },
      ];

      const { status, data } = await store.organization.create(organization);
      if (status !== 200) {
        switch (status) {
          default:
            store.pushToastMessage({
              message: t('Something went wrong'),
              severity: 'error',
            });
            return;
        }
      }
      store.organization.setSelected(data, store.user);
      store.organization.setItems([data]);
      setOrganizationId(data._id);
    } catch (error) {
      console.error(error);
      store.pushToastMessage({
        message: t('Something went wrong'),
        severity: 'error',
      });
    }
  };

  const onSubmitted = () => {
    router.push(`/${store.organization.selected.name}/dashboard`, undefined, {
      locale: store.organization.selected.locale,
    });
  };

  if (store.organization.items.length) {
    router.push(`/${store.organization.selected.name}/dashboard`);
    return null;
  }

  return (
    <Page>
      <Container maxWidth="sm">
        <Box my={5}>
          <Welcome />
        </Box>
        <Box pb={4}>
          <Typography variant="subtitle2" align="center" color="textSecondary">
            {t('One more step, tell us who will rent the properties')}
          </Typography>
        </Box>
        <Paper>
          <Box px={4} pb={4} pt={2}>
            <Landlord onSubmit={onSubmit} onSubmitted={onSubmitted} />
          </Box>
        </Paper>
      </Container>
    </Page>
  );
});

export default withAuthentication(FirstAccess);
