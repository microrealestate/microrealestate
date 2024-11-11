import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { fetchOrganizations, QueryKeys } from '../../../utils/restcalls';
import { useContext, useState } from 'react';
import ApplicationFormDialog from '../../../components/organization/members/ApplicationFormDialog';
import ApplicationShowDialog from '../../../components/organization/members/ApplicationShowDialog';
import { LuPlusCircle } from 'react-icons/lu';
import MemberFormDialog from '../../../components/organization/members/MemberFormDialog';
import Members from '../../../components/organization/Members';
import Page from '../../../components/Page';
import ShortcutButton from '../../../components/ShortcutButton';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
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
  const [openMemberFormDialog, setOpenMemberFormDialog] = useState(false);
  const [selectedOrgForMember, setSelectedOrgForMember] = useState(null);
  const [openApplicationFormDialog, setOpenApplicationFormDialog] =
    useState(false);
  const [selectedOrgForApp, setSelectedOrgForApp] = useState(null);
  const [openApplicationShowDialog, setOpenApplicationShowDialog] =
    useState(false);
  const [appCredz, setAppCredz] = useState(null);

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
            Icon={LuPlusCircle}
            onClick={() => {
              setSelectedOrgForMember(organization);
              setOpenMemberFormDialog(true);
            }}
            disabled={!store.user.isAdministrator}
          />
          <ShortcutButton
            label={t('New application')}
            Icon={LuPlusCircle}
            onClick={() => {
              setSelectedOrgForApp(organization);
              setOpenApplicationFormDialog(true);
            }}
            disabled={!store.user.isAdministrator}
          />
        </div>
      }
      dataCy="accessPage"
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
        open={openMemberFormDialog}
        setOpen={setOpenMemberFormDialog}
        data={selectedOrgForMember}
      />
      <ApplicationFormDialog
        open={openApplicationFormDialog}
        setOpen={setOpenApplicationFormDialog}
        data={selectedOrgForApp}
        onClose={(appCredz) => {
          if (!appCredz) return;
          setAppCredz(appCredz);
          setOpenApplicationShowDialog(true);
        }}
      />
      <ApplicationShowDialog
        open={openApplicationShowDialog}
        setOpen={setOpenApplicationShowDialog}
        data={appCredz}
        onClose={() => setAppCredz(null)}
      />
    </Page>
  );
}

export default withAuthentication(AccessSettings);
