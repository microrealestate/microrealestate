import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function AccountSettings() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <Page dataCy="accountPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Account')}</CardTitle>
          <CardDescription>{t('Your account information')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="first-name">{t('First name')}</Label>
            <Input id="first-name" value={store.user.firstName} disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="last-name">{t('Last name')}</Label>
            <Input id="last-name" value={store.user.lastName} disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t('Email')}</Label>
            <Input id="email" value={store.user.email} disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">{t('Role')}</Label>
            <Input id="role" value={t(store.user.role)} disabled />
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(AccountSettings);
