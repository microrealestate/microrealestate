import common from '../locales/en/common.json';
import I18nProvider from 'next-translate/I18nProvider';
import { muiTheme } from 'storybook-addon-material-ui';
import theme from './styles/theme';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
    },
  },
};

function translateDecorator(Story) {
  return (
    <I18nProvider lang="en" namespaces={{ common }}>
      <Story />
    </I18nProvider>
  );
}

export const decorators = [muiTheme(theme), translateDecorator];
