import {
  AppBar,
  Box,
  Container,
  Grid,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { memo, useCallback, useContext, useEffect, useState } from 'react';

import { ElevationScroll } from './Scroll';
import Loading from './Loading';
import OrganizationSwitcher from './organization/OrganizationSwitcher';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import { StoreContext } from '../store';
import getConfig from 'next/config';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const {
  publicRuntimeConfig: { DEMO_MODE, APP_NAME, BASE_PATH },
} = getConfig();

const Demonstrationbar = memo(function Demonstrationbar() {
  const { t } = useTranslation('common');
  return DEMO_MODE ? (
    <Box color="primary.contrastText" bgcolor="success.dark">
      <Typography variant="button" component="div" align="center">
        {t('Demonstration mode')}
      </Typography>
    </Box>
  ) : null;
});

const MainToolbar = memo(function MainToolbar({ visible }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const signOut = useCallback(
    async (event) => {
      event.preventDefault();
      await store.user.signOut();
      window.location.assign(BASE_PATH); // will be redirected to /signin
    },
    [store.user]
  );

  return visible ? (
    <Toolbar>
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h5">{APP_NAME}</Typography>
        <Box display="flex" alignItems="center">
          {!!(store.organization.items && store.organization.items.length) && (
            <OrganizationSwitcher />
          )}
          <Tooltip title={t('Sign out')} aria-label="sign out">
            <IconButton
              aria-label="sign out"
              onClick={signOut}
              color="default"
              data-cy="signout"
            >
              <PowerSettingsNewIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Toolbar>
  ) : null;
});

const SubToolbars = memo(function SubToolbars({
  visible,
  PrimaryToolbar,
  SecondaryToolbar,
}) {
  return visible ? (
    <ElevationScroll>
      <AppBar position="sticky">
        <Toolbar>
          <Grid
            container
            alignItems="center"
            justifyContent="space-between"
            wrap="nowrap"
            spacing={5}
          >
            <Grid item>{PrimaryToolbar}</Grid>
            <Grid item>{SecondaryToolbar}</Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    </ElevationScroll>
  ) : null;
});

const Page = observer(
  ({ children, PrimaryToolbar, SecondaryToolbar, maxWidth = 'lg' }) => {
    console.log('Page functional component');
    const store = useContext(StoreContext);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const routeChangeStart = (url, { shallow }) => {
        if (!shallow) {
          setLoading(true);
        }
      };
      const routeChangeComplete = (url, { shallow }) => {
        if (!shallow) {
          setLoading(false);
        }
      };

      router.events.on('routeChangeStart', routeChangeStart);
      router.events.on('routeChangeComplete', routeChangeComplete);

      return () => {
        router.events.off('routeChangeStart', routeChangeStart);
        router.events.off('routeChangeComplete', routeChangeComplete);
      };
    }, []);

    return (
      <>
        <Demonstrationbar />

        <MainToolbar visible={store.user.signedIn} />

        <SubToolbars
          visible={!loading && (PrimaryToolbar || SecondaryToolbar)}
          PrimaryToolbar={PrimaryToolbar}
          SecondaryToolbar={SecondaryToolbar}
        />

        <Box mt={!loading && (PrimaryToolbar || SecondaryToolbar) ? 4 : 0}>
          <Container maxWidth={maxWidth}>
            {loading ? <Loading /> : children}
          </Container>
        </Box>
      </>
    );
  }
);

export default memo(Page);
