import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { useEffect, useState } from 'react';

import { apiFetcher } from '../../../utils/fetch';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import Page from '../../../components/Page';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';
import { toast } from 'sonner';

const SECRET_PLACEHOLDER = '**********';

function getInitialForm() {
  return {
    selected: true,
    tenantId: '',
    clientId: '',
    clientSecret: '',
    mailboxEmail: '',
    notificationEmails: '',
    pollingEnabled: true,
    pollingHourUtc: 6,
    hasClientSecret: false,
    lastSuccessfulSyncAt: null,
    lastSyncAt: null,
    lastSyncError: ''
  };
}

function UtilitiesEmailConnectionSettings() {
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [recapturingAll, setRecapturingAll] = useState(false);
  const [form, setForm] = useState(getInitialForm());
  const [clientSecretChanged, setClientSecretChanged] = useState(false);

  const loadConnection = async () => {
    setLoading(true);
    try {
      const response = await apiFetcher().get('/utilities/email-connection');
      const data = response.data || {};
      setForm({
        selected: data.selected !== false,
        tenantId: data.tenantId || '',
        clientId: data.clientId || '',
        clientSecret: data.clientSecret || '',
        mailboxEmail: data.mailboxEmail || '',
        notificationEmails: Array.isArray(data.notificationEmails)
          ? data.notificationEmails.join(', ')
          : '',
        pollingEnabled: data.pollingEnabled !== false,
        pollingHourUtc:
          Number.isFinite(Number(data.pollingHourUtc))
            ? Number(data.pollingHourUtc)
            : 6,
        hasClientSecret: !!data.hasClientSecret,
        lastSuccessfulSyncAt: data.lastSuccessfulSyncAt || null,
        lastSyncAt: data.lastSyncAt || null,
        lastSyncError: data.lastSyncError || ''
      });
      setClientSecretChanged(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to load email connection')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnection();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetcher().put('/utilities/email-connection', {
        selected: form.selected,
        tenantId: form.tenantId,
        clientId: form.clientId,
        clientSecret: form.clientSecret,
        clientSecretUpdated: clientSecretChanged,
        mailboxEmail: form.mailboxEmail,
        notificationEmails: form.notificationEmails,
        pollingEnabled: form.pollingEnabled,
        pollingHourUtc: Number(form.pollingHourUtc)
      });

      toast.success(t('Email connection saved'));
      await loadConnection();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await apiFetcher().post('/utilities/email-connection/test');
      toast.success(
        t('Connection successful. Checked {{count}} message(s).', {
          count: Number(response.data?.messageCountChecked || 0)
        })
      );
      await loadConnection();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('Connection test failed'));
    } finally {
      setTesting(false);
    }
  };

  const handleRecaptureAll = async () => {
    setRecapturingAll(true);
    try {
      const response = await apiFetcher().post('/utilities/recapture-all-from-email');
      const { restored = 0, alreadyPresent = 0, failed = 0 } = response.data || {};
      if (restored > 0) {
        toast.success(
          t('Recaptured {{n}} bill(s). {{p}} already present. {{f}} failed.', {
            n: restored, p: alreadyPresent, f: failed
          })
        );
      } else {
        toast.info(
          t('No bills restored. {{p}} already present, {{f}} failed.', {
            p: alreadyPresent, f: failed
          })
        );
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('Recapture failed'));
    } finally {
      setRecapturingAll(false);
    }
  };

  return (
    <Page loading={loading} dataCy="utilitiesEmailConnectionSettingsPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Utilities email Graph connection')}</CardTitle>
          <CardDescription>
            {t(
              'Configure the Outlook mailbox connection used to import utility payment confirmations.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="utilities-email-selected"
                type="checkbox"
                checked={form.selected}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    selected: event.target.checked
                  }))
                }
              />
              <label htmlFor="utilities-email-selected" className="text-sm">
                {t('Enable utilities email import')}
              </label>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                {t('Tenant ID')}
              </label>
              <Input
                type="text"
                value={form.tenantId}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    tenantId: event.target.value
                  }))
                }
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                {t('Client ID')}
              </label>
              <Input
                type="text"
                value={form.clientId}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    clientId: event.target.value
                  }))
                }
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                {t('Client secret')}
              </label>
              <Input
                type="password"
                value={form.clientSecret}
                placeholder={form.hasClientSecret ? SECRET_PLACEHOLDER : ''}
                onChange={(event) => {
                  setClientSecretChanged(true);
                  setForm((previous) => ({
                    ...previous,
                    clientSecret: event.target.value
                  }));
                }}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                {t('Mailbox email')}
              </label>
              <Input
                type="email"
                value={form.mailboxEmail}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    mailboxEmail: event.target.value
                  }))
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">
                {t('Notification emails (comma-separated)')}
              </label>
              <Input
                type="text"
                value={form.notificationEmails}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    notificationEmails: event.target.value
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="utilities-email-polling-enabled"
                type="checkbox"
                checked={form.pollingEnabled}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    pollingEnabled: event.target.checked
                  }))
                }
              />
              <label htmlFor="utilities-email-polling-enabled" className="text-sm">
                {t('Enable daily polling')}
              </label>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                {t('Polling hour (UTC, 0-23)')}
              </label>
              <Input
                type="number"
                min="0"
                max="23"
                value={form.pollingHourUtc}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    pollingHourUtc: event.target.value
                  }))
                }
              />
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm space-y-1">
            <div>
              {t('Last successful sync')}:{' '}
              {form.lastSuccessfulSyncAt
                ? new Date(form.lastSuccessfulSyncAt).toLocaleString()
                : t('Never')}
            </div>
            <div>
              {t('Last sync attempt')}:{' '}
              {form.lastSyncAt
                ? new Date(form.lastSyncAt).toLocaleString()
                : t('Never')}
            </div>
            {form.lastSyncError ? (
              <div className="text-red-600">
                {t('Last sync error')}: {form.lastSyncError}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleRecaptureAll}
              disabled={recapturingAll || saving || testing}
              title={t('Re-fetch email content for all email-imported bills that are missing their saved file')}
            >
              {recapturingAll ? t('Recapturing...') : t('Recapture all email bills')}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing || recapturingAll}>
              {testing ? t('Testing...') : t('Test connection')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t('Saving...') : t('Save settings')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(UtilitiesEmailConnectionSettings);
