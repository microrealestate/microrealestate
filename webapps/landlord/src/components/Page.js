import {
  AppBar,
  Box,
  Container,
  Hidden,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  withStyles,
} from '@material-ui/core';
import { memo, useCallback, useContext, useEffect, useState } from 'react';

import { ElevationScroll } from './Scroll';
import getConfig from 'next/config';
import { hexToRgb } from '../styles/styles';
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

const MobileTopBar = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.common.black,
    color: 'rgba(' + hexToRgb(theme.palette.common.white) + ', 0.8)',
  },
}))(Box);

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
        {SearchBar ? (
          <Toolbar variant="dense" disableGutters>
            <Box mt={6} width="100%">
              {SearchBar}
            </Box>
          </Toolbar>
        ) : null}
      </Hidden>

      <Hidden mdUp>
        <MobileTopBar
          position="fixed"
          top={0}
          left={0}
          width="100%"
          display="flex"
          justifyContent="space-between"
        >
          {!!(store.organization.items && store.organization.items.length) && (
            <OrganizationSwitcher />
          )}
          <Box>
            <IconButton
              aria-label="sign out"
              onClick={signOut}
              color="inherit"
              data-cy="signout"
            >
              <PowerSettingsNewIcon />
            </IconButton>
          </Box>
        </MobileTopBar>
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
        <Hidden smDown>
          <EnvironmentBar />
        </Hidden>
        <>
          <ElevationScroll>
            <AppBar position="sticky">
              <Container maxWidth={maxWidth}>
                <MainToolbar
                  visible={store.user.signedIn}
                  SearchBar={!loading && !routeloading ? SearchBar : null}
                />
              </Container>
            </AppBar>
          </ElevationScroll>
          {!loading && !routeloading ? (
            <Container maxWidth={maxWidth}>
              {PrimaryToolbar ? (
                <Box my={1}>
                  <SubToolbar
                    ContentBar={PrimaryToolbar}
                    ActionBar={ActionToolbar}
                  />
                </Box>
              ) : null}
              {SecondaryToolbar ? (
                <SubToolbar ContentBar={SecondaryToolbar} />
              ) : null}
            </Container>
          ) : null}
        </>

        <Box
          mt={
            !loading && !routeloading && (PrimaryToolbar || SecondaryToolbar)
              ? 0
              : 8
          }
        >
          <Container maxWidth={maxWidth}>
            {loading || routeloading ? (
              <Box
                position="fixed"
                top={0}
                left={0}
                width="100vw"
                height="100vh"
              >
                <Loading />
              </Box>
            ) : (
              <Box>{children}</Box>
            )}
          </Container>
        </Box>
      </>
    );
  }
);

export default memo(Page);
