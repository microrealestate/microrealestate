import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import Link from '../../../components/Link';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function SettingLink({ href, title, description }) {
  const store = useContext(StoreContext);

  return (
    <div className="flex flex-col gap-2 p-3">
      <Link
        href={`/${store.organization.selected.name}${href}`}
        className="text-base font-semibold"
      >
        {title}
      </Link>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Settings() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <Page dataCy="settingsPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Settings')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          <SettingLink
            href="/settings/account"
            title={t('Account')}
            description={t('Your account information')}
          />
          <SettingLink
            href="/settings/organizations"
            title={t('Organizations')}
            description={t('Your organizations')}
          />
          {store.user.isAdministrator ? (
            <>
              <div className="text-lg text-muted-foreground mt-6">
                {t('Organization information')}
              </div>
              <SettingLink
                href="/settings/landlord"
                title={t('Landlord')}
                description={t(
                  'Landlord information that will be shared with your tenants in contracts and invoices'
                )}
              />
              <SettingLink
                href="/settings/billing"
                title={t('Billing')}
                description={t(
                  'Billing information that will be shared with your tenants in invoices'
                )}
              />
              <SettingLink
                href="/settings/contracts"
                title={t('Contracts')}
                description={t('Contracts to manage your leases')}
              />
              <SettingLink
                href="/settings/access"
                title={t('Access')}
                description={t('Managing access to your organization')}
              />
              <SettingLink
                href="/settings/thirdparties"
                title={t('Third-parties')}
                description={t(
                  'Connect third-parties to extend the functionality of your organization'
                )}
              />
            </>
          ) : null}
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(Settings);
