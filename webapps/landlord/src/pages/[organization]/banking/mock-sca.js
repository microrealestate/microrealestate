import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { useCallback, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { LuLandmark } from 'react-icons/lu';
import Page from '../../../components/Page';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

// Stands in for the bank's own login/SCA page in a real XS2A flow (see
// system.md's provider comparison - no aggregator is contracted yet). Once
// a real provider is wired up, the landlord will land on the bank's own
// site here instead; nothing else in the connect flow needs to change.
const DEMO_TAN = 'DEMO-TAN-123456';

function MockScaPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { connectionId, returnUrl } = router.query;
  const [tan, setTan] = useState('');

  const redirectBack = useCallback(
    (authorizationCode) => {
      const url = new URL(returnUrl);
      url.searchParams.set('connectionId', connectionId);
      url.searchParams.set('authorizationCode', authorizationCode);
      window.location.href = url.toString();
    },
    [connectionId, returnUrl]
  );

  const handleConfirm = useCallback(
    (event) => {
      event.preventDefault();
      redirectBack(tan || DEMO_TAN);
    },
    [redirectBack, tan]
  );

  const handleDeny = useCallback(() => {
    redirectBack('DENY');
  }, [redirectBack]);

  // router.query is only reliably populated once Next's router has finished
  // resolving the current route. Right after the client-side navigation
  // from the "Connect bank account" dialog, isReady can briefly be false
  // and connectionId/returnUrl would read as undefined even though they
  // are present in the URL - rendering nothing in that window makes the
  // page look like it hung blank. Show a loading state instead and only
  // fall back to a blank render once the router is actually ready but the
  // params are genuinely missing (e.g. a direct visit without a query
  // string).
  if (!router.isReady) {
    return <Page className="max-w-md" dataCy="mockScaPage" loading />;
  }

  if (!connectionId || !returnUrl) {
    return null;
  }

  return (
    <Page className="max-w-md" dataCy="mockScaPage">
      <div className="mb-6 rounded-md border border-warning bg-warning/10 p-3 text-sm text-warning">
        {t(
          "Demo mode: this page simulates your bank's own login page. No real bank is contacted."
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LuLandmark className="size-6" />
            {t('Sign in to your bank')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleConfirm}>
            <div className="space-y-2">
              <Label htmlFor="mock-username">{t('Username')}</Label>
              <Input id="mock-username" defaultValue="demo-user" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mock-pin">{t('PIN')}</Label>
              <Input
                id="mock-pin"
                type="password"
                defaultValue="••••••"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mock-tan">{t('TAN')}</Label>
              <Input
                id="mock-tan"
                data-cy="mockTanInput"
                placeholder={DEMO_TAN}
                value={tan}
                onChange={(event) => setTan(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" data-cy="mockScaConfirmButton">
                {t('Confirm')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDeny}
                data-cy="mockScaDenyButton"
              >
                {t('Deny access')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(MockScaPage);
