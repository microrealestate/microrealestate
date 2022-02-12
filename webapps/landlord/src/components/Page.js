import {
  AppBar,
  Box,
  Container,
  Hidden,
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

const MainToolbar = memo(function MainToolbar({ visible, SearchBar }) {
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
    <>
      <Hidden smDown>
        <Toolbar disableGutters>
          <Box display="flex" alignItems="center" width="100%">
            <Typography variant="h5">{APP_NAME}</Typography>
            <Box flexGrow={1} mx={10}>
              {SearchBar}
            </Box>
            <Box display="flex">
              {!!(
                store.organization.items && store.organization.items.length
              ) && <OrganizationSwitcher />}
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
      </Hidden>
      <Hidden mdUp>
        <Toolbar variant="dense" disableGutters>
          <Box display="flex" justifyContent="space-between" width="100%">
            {!!(
              store.organization.items && store.organization.items.length
            ) && <OrganizationSwitcher />}
            <Box>
              <IconButton
                aria-label="sign out"
                onClick={signOut}
                color="default"
                data-cy="signout"
              >
                <PowerSettingsNewIcon />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </Hidden>

      <Hidden mdUp>
        {SearchBar ? (
          <Toolbar variant="dense" disableGutters>
            <Box width="100%">{SearchBar}</Box>
          </Toolbar>
        ) : null}
      </Hidden>
    </>
  ) : null;
});

const SubToolbar = memo(function SubToolbar({ ContentBar, ActionBar }) {
  return (
    <Toolbar disableGutters>
      {ActionBar ? (
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box>{ContentBar}</Box>
          <Box>{ActionBar}</Box>
        </Box>
      ) : (
        <Box width="100%">{ContentBar}</Box>
      )}
    </Toolbar>
  );
});

const Page = observer(
  ({
    children,
    SearchBar,
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

        {!loading && !routeloading ? (
          <>
            <ElevationScroll>
              <AppBar position="sticky">
                <Container maxWidth={maxWidth}>
                  <MainToolbar
                    visible={store.user.signedIn}
                    SearchBar={SearchBar}
                  />
                </Container>
              </AppBar>
            </ElevationScroll>
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
          </>
        ) : null}

        <Box
          mt={
            !loading && !routeloading && (PrimaryToolbar || SecondaryToolbar)
              ? 4
              : 0
          }
          mb={10}
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
