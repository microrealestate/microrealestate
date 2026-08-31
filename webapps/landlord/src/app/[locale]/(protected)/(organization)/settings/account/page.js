'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { Input } from '@microrealestate/commonui/components/ui/input';
import { Label } from '@microrealestate/commonui/components/ui/label';
import { useTranslations } from 'next-intl';
import ChangePasswordForm from '@/components/account/ChangePasswordForm';
import Page from '@/components/Page';
import { useStore } from '@/providers/StoreProvider';

function AccountSettings() {
  const t = useTranslations('common');
  const store = useStore();

  return (
    <Page dataCy="accountPage">
      <div className="space-y-6">
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('Change password')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}

export default function AccountSettingsPage() {
  return <AccountSettings />;
}
