import config from '../config';

export const isServer = () => typeof window === 'undefined';

export const isClient = () => !isServer();

export const redirect = (context, path) => {
  if (isClient()) {
    throw new Error('cannot use redirect function client side');
  }

  context.res.writeHead(302, {
    Location: `${config.APP_URL}/${context.locale}${path}`,
  });
  context.res.end();
};
