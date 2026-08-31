import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Card } from '@microrealestate/commonui/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { LuCopy, LuTrash } from 'react-icons/lu';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';
import {
  deleteMemberAccount,
  provisionMember,
  QueryKeys,
  updateOrganization
} from '../../utils/restcalls';
import ConfirmDialog from '../ConfirmDialog';
import { mergeOrganization, updateStoreOrganization } from './utils';

const SLOTS = ['member1', 'member2'];

export default function Members({ organization }) {
  const t = useTranslations('common');
  const store = useStore();
  const queryClient = useQueryClient();
  const { mutateAsync, isError } = useMutation({
    mutationFn: updateOrganization,
    onSuccess: (organization) => {
      updateStoreOrganization(store, organization);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORGANIZATION] });
    }
  });

  // only member1 may add or remove a collaborator, the service enforces it and
  // the other member gets a read-only view rather than controls that would 403
  const isOwner =
    !!store.user.email &&
    store.user.email.toLowerCase() ===
      organization?.member1?.email?.toLowerCase();

  const [openRemoveConfirmDialog, setOpenRemoveConfirmDialog] = useState(false);
  const [slotToRemove, setSlotToRemove] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const saveSlot = useCallback(
    async (slot, member) => {
      const updated = await mutateAsync({
        store,
        organization: mergeOrganization(organization, { [slot]: member })
      });
      if (!updated) {
        throw new Error('failed to update the organization members');
      }
    },
    [mutateAsync, organization, store]
  );

  const handleSave = useCallback(
    async (slot, { firstName, lastName, email }) => {
      setUpdating(slot);
      setCredentials(null);
      try {
        await saveSlot(slot, { email });
        const { temporaryPassword } = await provisionMember({
          firstname: firstName,
          lastname: lastName,
          email
        });
        setCredentials({ email, temporaryPassword });
      } catch (error) {
        console.error(error);
        if (error.response?.status === 409) {
          toast.error(t('This collaborator already has an account'));
        } else {
          toast.error(t('Something went wrong'));
        }
      } finally {
        setUpdating(null);
      }
    },
    [saveSlot, t]
  );

  const handleRemove = useCallback(
    async (slot) => {
      const email = organization?.[slot]?.email;
      setUpdating(slot);
      setCredentials(null);
      try {
        await saveSlot(slot, null);
        if (email) {
          await deleteMemberAccount(email);
        }
      } catch (error) {
        console.error(error);
        toast.error(t('Something went wrong'));
      } finally {
        setUpdating(null);
      }
    },
    [organization, saveSlot, t]
  );

  if (isError) {
    toast.error(t('Error fetching members'));
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {SLOTS.map((slot, index) => (
          <MemberSlot
            key={slot}
            slot={slot}
            label={t(index === 0 ? 'Collaborator 1' : 'Collaborator 2')}
            member={organization?.[slot]}
            readOnly={!isOwner}
            // the organization must always keep a reachable account
            removable={isOwner && slot !== 'member1'}
            otherEmail={
              organization?.[slot === 'member1' ? 'member2' : 'member1']?.email
            }
            disabled={!!updating}
            onSave={(values) => handleSave(slot, values)}
            onRemove={() => {
              setSlotToRemove(slot);
              setOpenRemoveConfirmDialog(true);
            }}
          />
        ))}
        {credentials ? (
          <TemporaryPassword
            email={credentials.email}
            password={credentials.temporaryPassword}
          />
        ) : null}
      </div>
      <ConfirmDialog
        title={t('Are you sure to remove this collaborator?')}
        subTitle={t('The account of {email} will be deleted', {
          email: organization?.[slotToRemove]?.email || ''
        })}
        open={openRemoveConfirmDialog}
        setOpen={setOpenRemoveConfirmDialog}
        data={slotToRemove}
        onConfirm={handleRemove}
      />
    </>
  );
}

function TemporaryPassword({ email, password }) {
  const t = useTranslations('common');

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success(t('Copied to clipboard'));
    } catch (error) {
      console.error(error);
    }
  }, [password, t]);

  return (
    <Card className="p-4 space-y-2" data-cy="temporaryPassword">
      <div className="text-lg">{t('Temporary password')}</div>
      <div className="flex items-center gap-2">
        <code className="grow rounded-md bg-muted px-3 py-2 font-mono text-base break-all">
          {password}
        </code>
        <Button
          variant="ghost"
          size="icon"
          onClick={copy}
          data-cy="copyPassword"
        >
          <LuCopy className="size-5" />
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        {t(
          'This password is shown only once. Send it to {email} — they will be asked to change it when they sign in.',
          { email }
        )}
      </div>
    </Card>
  );
}

function MemberSlot({
  slot,
  label,
  member,
  readOnly,
  removable,
  otherEmail,
  disabled,
  onSave,
  onRemove
}) {
  const t = useTranslations('common');
  // an account is behind the slot: the email is the link to it and changing it
  // would orphan the account, so the collaborator has to be removed instead
  const registered = !!member?.registered;

  const initialValues = useMemo(
    () => ({ firstName: '', lastName: '', email: member?.email || '' }),
    [member?.email]
  );

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        firstName: Yup.string().required(),
        lastName: Yup.string().required(),
        email: Yup.string()
          .email()
          .notOneOf(otherEmail ? [otherEmail] : [])
          .required()
      }),
    [otherEmail]
  );

  if (registered || readOnly) {
    return (
      <Card className="p-4">
        <div className="text-lg mb-2">{label}</div>
        <div className="flex items-center justify-between gap-2">
          <div className="break-all">
            {member?.email
              ? member.name
                ? `${member.name} (${member.email})`
                : member.email
              : '—'}
          </div>
          {removable ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-12"
              onClick={onRemove}
              disabled={disabled}
              data-cy={`remove-${slot}`}
            >
              <LuTrash className="size-6" />
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="text-lg mb-2">{label}</div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSave}
      >
        {() => (
          <Form autoComplete="off">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField
                label={t('First name')}
                name="firstName"
                disabled={disabled}
              />
              <TextField
                label={t('Last name')}
                name="lastName"
                disabled={disabled}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-[1fr_auto] md:items-start">
              <TextField label={t('Email')} name="email" disabled={disabled} />
              <div className="flex gap-2 md:pt-8">
                <Button
                  type="submit"
                  disabled={disabled}
                  data-cy={`create-${slot}`}
                >
                  {t('Create account')}
                </Button>
                {removable && member?.email ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-12"
                    onClick={onRemove}
                    disabled={disabled}
                    data-cy={`remove-${slot}`}
                  >
                    <LuTrash className="size-6" />
                  </Button>
                ) : null}
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </Card>
  );
}
