import * as Yup from 'yup';

import { ADMIN_ROLE, RENTER_ROLE, ROLES } from '../../store/User';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Select,
  TableHead,
  Typography,
} from '@material-ui/core';
import { Form, Formik } from 'formik';
import { FormSection, FormTextField, SelectField, SubmitButton } from '../Form';
import { memo, useCallback, useContext, useMemo, useState } from 'react';
import { RestrictButton, RestrictIconButton } from '../RestrictedComponents';

import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { observer } from 'mobx-react-lite';
import PersonIcon from '@material-ui/icons/Person';
import { StoreContext } from '../../store';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import useConfirmDialog from '../ConfirmDialog';
import useTranslation from 'next-translate/useTranslation';
import WarningIcon from '@material-ui/icons/Warning';

const allowedRoles = [ADMIN_ROLE];

const initialValues = {
  email: '',
  role: RENTER_ROLE,
};

const FormDialog = memo(function FormDialog({ members = [], onSubmit }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const handleClickOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const _onSubmit = useCallback(
    async (member) => {
      await onSubmit(member);
      handleClose();
    },
    [onSubmit, handleClose]
  );

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        email: Yup.string()
          .email()
          .notOneOf(members.map(({ email }) => email))
          .required(),
        role: Yup.string().required(),
      }),
    [members]
  );

  const roleValues = useMemo(
    () => ROLES.map((role) => ({ id: role, label: t(role), value: role })),
    [t]
  );

  return (
    <>
      <RestrictButton
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleClickOpen}
        onlyRoles={allowedRoles}
      >
        {t('New collaborator')}
      </RestrictButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {({ isSubmitting }) => {
            return (
              <Form autoComplete="off">
                <DialogTitle id="form-dialog-title">
                  {t('New collaborator')}
                </DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    {t('Add a new collaborator to your organization')}
                  </DialogContentText>
                  <Box minHeight={100} minWidth={500}>
                    <Grid container spacing={1}>
                      <Grid item xs={7}>
                        <FormTextField label={t('Email')} name="email" />
                      </Grid>
                      <Grid item xs={5}>
                        <SelectField
                          label={t('Role')}
                          name="role"
                          values={roleValues}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose}>{t('Cancel')}</Button>
                  <SubmitButton
                    label={!isSubmitting ? t('Add') : t('Submitting')}
                    onlyRoles={allowedRoles}
                  />
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Dialog>
    </>
  );
});

const Members = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [ConfirmDialog, setMemberToRemove, memberToRemove] = useConfirmDialog();
  const [updating, setUpdating] = useState();

  const onAddMember = useCallback(
    async (member) => {
      const updatedMembers = [...store.organization.selected.members, member];
      await onSubmit({
        members: updatedMembers,
      });
    },
    [onSubmit, store.organization.selected.members]
  );

  const removeMember = useCallback(
    async (member) => {
      setUpdating(member);
      const updatedMembers = store.organization.selected.members.filter(
        ({ email }) => email !== member.email
      );
      await onSubmit({
        members: updatedMembers,
      });
      setUpdating();
    },
    [onSubmit, store.organization.selected.members]
  );

  const onRoleChange = useCallback(
    async (role, member) => {
      setUpdating(member);
      const updatedMembers = store.organization.selected.members.filter(
        ({ email }) => email !== member.email
      );
      updatedMembers.push({
        ...member,
        role: role,
      });
      await onSubmit({
        members: updatedMembers,
      });
      setUpdating();
    },
    [onSubmit, store.organization.selected.members]
  );

  return (
    <FormSection label={t('Collaborators')}>
      <Box py={2}>
        <FormDialog
          members={store.organization.selected?.members}
          onSubmit={onAddMember}
        />
      </Box>
      <Paper variant="outlined" square>
        <Table aria-label="member table">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>
                <Typography>{t('Collaborator')}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{t('Email')}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>{t('Role')}</Typography>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(store.organization.selected?.members || []).map((member) => {
              const isCurrentUser = store.user.email === member.email;
              const isAdministrator = member.role === ADMIN_ROLE;
              const isRegistered = member.registered;
              return (
                <TableRow hover size="small" key={member.email}>
                  <TableCell align="center">
                    {updating === member ? (
                      <CircularProgress size={20} />
                    ) : isAdministrator ? (
                      <SupervisorAccountIcon />
                    ) : (
                      <PersonIcon />
                    )}
                  </TableCell>
                  <TableCell>
                    {isRegistered ? (
                      <Typography noWrap>{member.name}</Typography>
                    ) : (
                      <Box
                        color="warning.dark"
                        display="flex"
                        alignItems="center"
                      >
                        <WarningIcon fontSize="small" />
                        <Box pl={1}>
                          <Typography noWrap>
                            {t('User not registered')}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography noWrap>{member.email}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {isCurrentUser || !store.user.isAdministrator ? (
                      <Typography noWrap>{t(member.role)}</Typography>
                    ) : (
                      <Select
                        defaultValue={member.role}
                        onChange={(event) =>
                          onRoleChange(event.target.value, member)
                        }
                        displayEmpty
                        disabled={!!updating}
                      >
                        {ROLES.map((role) => (
                          <MenuItem key={role} value={role}>
                            {t(role)}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {!isCurrentUser && (
                      <RestrictIconButton
                        aria-label="delete"
                        onlyRoles={allowedRoles}
                        onClick={() => setMemberToRemove(member)}
                        disabled={!!updating}
                      >
                        <DeleteIcon fontSize="small" />
                      </RestrictIconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ConfirmDialog
          title={t('Are you sure to remove this collaborator?')}
          subTitle={memberToRemove.name}
          onConfirm={removeMember}
        />
      </Paper>
    </FormSection>
  );
});

export default Members;
