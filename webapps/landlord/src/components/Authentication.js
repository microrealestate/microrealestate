import { getStoreInstance, StoreContext } from '../store';
import { isServer, redirect } from '../utils';
import { setAcceptLanguage, setOrganizationId } from '../utils/fetch';
import { useContext, useEffect } from 'react';

import Cookies from 'universal-cookie';
import ErrorPage from 'next/error';
import getConfig from 'next/config';
import moment from 'moment';
import { Observer } from 'mobx-react-lite';
import { toJS } from 'mobx';

const {
  publicRuntimeConfig: { BASE_PATH },
} = getConfig();

export function withAuthentication(PageComponent) {
  function WithAuth(pageProps) {
    console.log('WithAuth functional component');
    const store = useContext(StoreContext);

    useEffect(() => {
      if (pageProps.error?.statusCode === 403) {
        window.location.assign(BASE_PATH); // will be redirected to /signin
      }
    }, [pageProps.error?.statusCode]);

    if (pageProps.error) {
      if (pageProps.error.statusCode === 403) {
        return null;
      }

      return <ErrorPage statusCode={pageProps.error.statusCode} />;
    }

    return (
      <Observer>
        {() => (store.user.signedIn ? <PageComponent {...pageProps} /> : null)}
      </Observer>
    );
  }

  WithAuth.getInitialProps = async (context) => {
    console.log('WithAuth.getInitialProps');
    if (isServer()) {
      // needed to update axios headers with Accept-Language for future requests done during SSR
      // like that the targeted service requested will get this header
      // see /api/documents, /api/templates
      setAcceptLanguage(context.req.headers['accept-language']);
    }
    const store = getStoreInstance();
    context.store = store;
    if (isServer()) {
      try {
        const cookies = new Cookies(context.req.headers.cookie);
        const refreshToken = cookies.get('refreshToken');
        if (!refreshToken) {
          console.log('no refresh token found redirecting to /signin');
          redirect(context, '/signin');
          return {};
        }

        // Force the refresh tokens to check the validity of the tokens
        // and to get a new ones (refreshToken and accessToken)
        await store.user.refreshTokens(context);
        if (!store.user.signedIn) {
          console.log('current refresh token invalid redirecting to /signin');
          redirect(context, '/signin');
          return {};
        }

        await store.organization.fetch();
        if (store.organization.items.length) {
          const organizationName = context.query.organization;
          if (organizationName) {
            store.organization.setSelected(
              store.organization.items.find(
                (org) => org.name === organizationName
              ),
              store.user
            );
          } else {
            store.organization.setSelected(
              store.organization.items[0],
              store.user
            );
          }
          setOrganizationId(store.organization.selected?._id);
          moment.locale(store.organization.selected?.locale ?? 'en');
          if (!store.organization.selected) {
            return {
              error: {
                statusCode: 404,
              },
            };
          }
        }
      } catch (error) {
        console.error(error);
        return {
          error: {
            statusCode: error.response?.status || 500,
          },
        };
      }
    }

    const initialProps = PageComponent.getInitialProps
      ? await PageComponent.getInitialProps(context)
      : { initialState: { store: toJS(store) } };

    if (isServer() && initialProps.error?.statusCode === 403) {
      console.log('current refresh token invalid redirecting to /signin');
      redirect(context, '/signin');
      return {};
    }

    return initialProps;
  };
  return WithAuth;
}
