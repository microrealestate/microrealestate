import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { fetchOrganizations, QueryKeys } from '../../../utils/restcalls';
import { useContext, useState } from 'react';
import Members from '../../../components/organization/Members';
import Page from '../../../components/Page';
import { PlusCircleIcon } from 'lucide-react';
import ShortcutButton from '../../../components/ShortcutButton';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import useApplicationFormDialog from '../../../components/organization/members/ApplicationFormDialog';
import useApplicationShowDialog from '../../../components/organization/members/ApplicationShowDialog';
import useMemberFormDialog from '../../../components/organization/members/MemberFormDialog';
import { useQuery } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function AccessSettings() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.ORGANIZATIONS],
    queryFn: () => fetchOrganizations(store)
  });
  const [MemberFormDialog, setOpenMemberFormDialog] = useMemberFormDialog();
  const [ApplicationFormDialog, setOpenApplicationFormDialog] =
    useApplicationFormDialog();
  const [ApplicationShowDialog, setOpenApplicationShowDialog] =
    useApplicationShowDialog();
  const [appcredz, setAppCredz] = useState();

  if (isError) {
    toast.error(t('Error fetching organizations'));
  }

  const organization =
    data?.find((org) => org._id === store.organization.selected?._id) ||
    data?.[0];

  return (
    <Page
      loading={isLoading}
      ActionBar={
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          <ShortcutButton
            label={t('New collaborator')}
            Icon={PlusCircleIcon}
            onClick={() => setOpenMemberFormDialog(true)}
            disabled={!store.user.isAdministrator}
          />
          <ShortcutButton
            label={t('New application')}
            Icon={PlusCircleIcon}
            onClick={() => setOpenApplicationFormDialog(true)}
            disabled={!store.user.isAdministrator}
          />
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('Access')}</CardTitle>
          <CardDescription>
            {t('Managing access to your organization')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Members organization={organization} />
        </CardContent>
      </Card>
      <MemberFormDialog
        setOpen={setOpenMemberFormDialog}
        organization={organization}
      />
      <ApplicationFormDialog
        setOpen={setOpenApplicationFormDialog}
        organization={organization}
        onClose={(appCredz) => {
          if (!appCredz) return;
          setAppCredz(appCredz);
          setOpenApplicationShowDialog(true);
        }}
      />
      <ApplicationShowDialog
        setOpen={setOpenApplicationShowDialog}
        appcredz={appcredz}
        onClose={() => setAppCredz(null)}
      />
    </Page>
  );
}

export default withAuthentication(AccessSettings);
