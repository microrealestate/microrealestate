import { ADMIN_ROLE, ROLES } from '../../store/User';
import { mergeOrganization, updateStoreOrganization } from './utils';
import { QueryKeys, updateOrganization } from '../../utils/restcalls';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { useCallback, useContext, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../../utils';
import ConfirmDialog from '../ConfirmDialog';
import { LuTrash } from 'react-icons/lu';
import moment from 'moment';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

export default function Members({ organization }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const queryClient = useQueryClient();
  const { mutateAsync, isError } = useMutation({
    mutationFn: updateOrganization,
    onSuccess: (organization) => {
      updateStoreOrganization(store, organization);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORGANIZATIONS] });
    }
  });

  const [openMemberToRemoveConfirmDialog, setOpenMemberToRemoveConfirmDialog] =
    useState(false);
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState(null);
  const [openAppToRemoveConfirmDialog, setOpenAppToRemoveConfirmDialog] =
    useState(false);
  const [selectedAppToRemove, setSelectedAppToRemove] = useState(null);
  const [updating, setUpdating] = useState();

  const handleRemoveMember = useCallback(
    async (member) => {
      setUpdating(member);
      await mutateAsync({
        store,
        organization: mergeOrganization(organization, {
          members: organization.members.filter(
            ({ email }) => email !== member.email
          )
        })
      });
      setUpdating();
    },
    [mutateAsync, organization, store]
  );

  const handleRemoveApplication = useCallback(
    async (app) => {
      setUpdating(app);
      await mutateAsync({
        store,
        organization: mergeOrganization(organization, {
          applications: organization.applications.filter(
            ({ clientId }) => clientId !== app.clientId
          )
        })
      });
      setUpdating();
    },
    [mutateAsync, organization, store]
  );

  const onRoleChange = useCallback(
    async (role, member) => {
      setUpdating(member);
      const updatedMembers = organization.members.filter(
        ({ email }) => email !== member.email
      );
      updatedMembers.push({
        ...member,
        role: role
      });
      await mutateAsync({
        store,
        organization: mergeOrganization(organization, {
          members: updatedMembers
        })
      });
      setUpdating();
    },
    [mutateAsync, organization, store]
  );

  if (isError) {
    toast.error(t('Error fetching members'));
  }

  return (
    <>
      <div className="text-xl mb-4">{t('Collaborators')}</div>
      <Card className="min-h-72">
        {organization.members
          ?.sort((m1, m2) => m1.email.localeCompare(m2.email))
          .map((member, index) => {
            const isAdministrator = member.role === ADMIN_ROLE;
            const isRegistered = member.registered;
            const isActionDisabled =
              !!updating ||
              store.user.role !== ADMIN_ROLE ||
              (store.user.email === member.email && isAdministrator);
            const isLastLine =
              organization.members.length - 1 === index &&
              organization.members.length >= 4;
            return (
              <div
                key={member.email}
                className={cn(
                  'grid grid-cols-1 p-4 gap-4',
                  'md:grid-cols-3 md:items-center',
                  !isLastLine ? 'border-b' : null
                )}
              >
                <div className="flex flex-col">
                  <div className="text-lg md:text-xl">{member.email}</div>
                  {!isRegistered ? (
                    <div className="text-warning text-xs">
                      {t('User not registered')}
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-2 md:col-start-3 md:col-end-3">
                  <Select
                    value={member.role}
                    onValueChange={(value) => onRoleChange(value, member)}
                    disabled={isActionDisabled}
                  >
                    <SelectTrigger className="flex-grow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(role)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedMemberToRemove(member);
                      setOpenMemberToRemoveConfirmDialog(true);
                    }}
                    disabled={isActionDisabled}
                    size="icon"
                    className="w-12"
                  >
                    <LuTrash className="size-6" />
                  </Button>
                </div>
              </div>
            );
          })}
      </Card>

      <div className="text-xl mt-8 mb-4">{t('Applications')}</div>
      <Card className="min-h-72">
        {organization.applications?.map((app, index) => {
          const expiryMoment = moment(app.expiryDate);
          const dateFormat = moment.localeData().longDateFormat('L');
          const isExpired = moment().isSameOrAfter(expiryMoment);
          const isLastLine =
            organization.applications.length - 1 === index &&
            organization.applications.length >= 4;
          return (
            <div
              key={app.clientId}
              className={cn(
                'grid grid-cols-1 p-4 gap-4',
                'md:grid-cols-3 md:items-center',
                !isLastLine ? 'border-b' : null
              )}
            >
              <div className="flex flex-col">
                <div className="text-lg md:text-xl">{app.name}</div>
                {!isExpired ? (
                  <div className="text-warning text-xs">
                    {t('Token is expired')}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-xs text-muted-foreground">
                  {t('Expiry date')}
                </div>
                {expiryMoment.format(dateFormat)}
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex-grow">{t(app.role)}</div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedAppToRemove(app);
                    setOpenAppToRemoveConfirmDialog(true);
                  }}
                  disabled={!!updating || store.user.role !== ADMIN_ROLE}
                  size="icon"
                  className="w-10"
                >
                  <LuTrash className="size-6" />
                </Button>
              </div>
            </div>
          );
        })}
      </Card>
      <ConfirmDialog
        title={t('Are you sure to remove this collaborator?')}
        subTitle={selectedMemberToRemove?.email}
        open={openMemberToRemoveConfirmDialog}
        setOpen={setOpenMemberToRemoveConfirmDialog}
        data={selectedMemberToRemove}
        onConfirm={handleRemoveMember}
      />
      <ConfirmDialog
        title={t('Are you sure to remove this application?')}
        subTitle={selectedAppToRemove?.name}
        open={openAppToRemoveConfirmDialog}
        setOpen={setOpenAppToRemoveConfirmDialog}
        data={selectedAppToRemove}
        onConfirm={handleRemoveApplication}
      />
    </>
  );
}
