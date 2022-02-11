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
import getConfig from 'next/config';
import Loading from './Loading';
import { observer } from 'mobx-react-lite';
import OrganizationSwitcher from './organization/OrganizationSwitcher';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const {
  publicRuntimeConfig: { DEMO_MODE, APP_NAME, BASE_PATH },
} = getConfig();

const EnvironmentBar = memo(function EnvironmentBar() {
  const { t } = useTranslation('common');
  return DEMO_MODE || process.env.NODE_ENV === 'development' ? (
    <Box
      color="primary.contrastText"
      bgcolor={DEMO_MODE ? 'success.dark' : 'grey.700'}
    >
      <Typography variant="button" component="div" align="center">
        {DEMO_MODE ? t('Demonstration mode') : t('Development mode')}
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

const SubToolbar = memo(function SubToolbar({ ContentBar, ActionBar }) {
  return (
    <Toolbar disableGutters>
      {ActionBar ? (
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Grid item xs={12} sm="auto">
            {ContentBar}
          </Grid>
          <Grid item xs={12} sm="auto">
            {ActionBar}
          </Grid>
        </Grid>
      ) : (
        <Box width="100%">{ContentBar}</Box>
      )}
    </Toolbar>
  );
});

const Page = observer(
  ({
    children,
    PrimaryToolbar,
    SecondaryToolbar,
    ActionToolbar,
    maxWidth = 'lg',
    loading = false,
  }) => {
    console.log('Page functional component');
    const store = useContext(StoreContext);
    const [routeloading, setRouteLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const routeChangeStart = (url, { shallow }) => {
        if (!shallow) {
          setRouteLoading(true);
        }
      };
      const routeChangeComplete = (url, { shallow }) => {
        if (!shallow) {
          setRouteLoading(false);
        }
      };

      router.events.on('routeChangeStart', routeChangeStart);
      router.events.on('routeChangeComplete', routeChangeComplete);

      return () => {
        router.events.off('routeChangeStart', routeChangeStart);
        router.events.off('routeChangeComplete', routeChangeComplete);
      };
    }, [router]);

    return (
      <>
        <EnvironmentBar />

        <MainToolbar visible={store.user.signedIn} />

        {!loading && !routeloading ? (
          <ElevationScroll>
            <AppBar position="sticky">
              <Container maxWidth={maxWidth}>
                {PrimaryToolbar ? (
                  <SubToolbar
                    ContentBar={PrimaryToolbar}
                    ActionBar={ActionToolbar}
                  />
                ) : null}
                {SecondaryToolbar ? (
                  <SubToolbar ContentBar={SecondaryToolbar} />
                ) : null}
              </Container>
            </AppBar>
          </ElevationScroll>
        ) : null}

        <Box
          mt={
            !loading && !routeloading && (PrimaryToolbar || SecondaryToolbar)
              ? 4
              : 0
          }
        >
          <Container maxWidth={maxWidth}>
            {loading || routeloading ? (
              <Box
                position="absolute"
                top={0}
                left={0}
                width="100vw"
                height="100vh"
              >
                <Loading />
              </Box>
            ) : (
              children
            )}
          </Container>
        </Box>
      </>
    );
  }
);

export default memo(Page);
