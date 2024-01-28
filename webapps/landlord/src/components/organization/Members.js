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
import {
  DateField,
  Section,
  SelectField,
  SubmitButton,
  TextField,
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { memo, useCallback, useContext, useMemo, useState } from 'react';
import { RestrictButton, RestrictIconButton } from '../RestrictedComponents';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import LinkIcon from '@material-ui/icons/Link';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import moment from 'moment';
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

const memberInitialValues = {
  email: '',
  role: RENTER_ROLE,
};

const MemberFormDialog = memo(function MemberFormDialog({
  members = [],
  onSubmit,
}) {
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
      >
        {t('New collaborator')}
      </RestrictButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <Formik
          initialValues={memberInitialValues}
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
                        <TextField label={t('Email')} name="email" />
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

const applicationInitialValues = {
  name: '',
  expiryDate: null,
  role: RENTER_ROLE,
};

const ApplicationFormDialog = memo(function ApplicationFormDialog({
  applications = [],
  onSubmit,
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const handleClickOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const _onSubmit = useCallback(
    async (app) => {
      await onSubmit(app);
      handleClose();
    },
    [onSubmit, handleClose]
  );

  const roleValues = useMemo(
    () => ROLES.map((role) => ({ id: role, label: t(role), value: role })),
    [t]
  );

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        name: Yup.string()
          .notOneOf(applications.map(({ name }) => name))
          .required(),
        expiryDate: Yup.mixed()
          .required()
          .test('expiryDate_invalid', 'Date is invalid', (value) => {
            if (value) {
              return moment(value).isValid();
            }
            return true;
          })
          .test('expiryDate_past', 'Date must be in the future', (value) => {
            if (value) {
              return moment(value).isAfter(moment(), 'days');
            }
            return true;
          }),
        role: Yup.string()
          .required()
          .oneOf(roleValues.map(({ value }) => value)),
      }),
    [applications, roleValues]
  );

  return (
    <>
      <RestrictButton
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleClickOpen}
      >
        {t('New application')}
      </RestrictButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <Formik
          initialValues={applicationInitialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {({ isSubmitting }) => {
            return (
              <Form autoComplete="off">
                <DialogTitle id="form-dialog-title">
                  {t('New application')}
                </DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    {t('Add a new application credential to your organization')}
                  </DialogContentText>
                  <Box minHeight={100} minWidth={500}>
                    <Grid container spacing={1}>
                      <Grid item xs={7}>
                        <TextField label={t('Name')} name="name" />
                      </Grid>
                      <Grid item xs={5}>
                        <SelectField
                          label={t('Role')}
                          name="role"
                          values={roleValues}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <DateField
                          label={t('Expiry date')}
                          name="expiryDate"
                          minDate={moment().add(1, 'days').toISOString()}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose}>{t('Cancel')}</Button>
                  <SubmitButton
                    label={!isSubmitting ? t('Add') : t('Submitting')}
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

const ApplicationShowDialog = memo(function ApplicationShowDialog({
  appcredz = null,
  onClose,
}) {
  const { t } = useTranslation('common');

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const [open, initialValues] = useMemo(() => {
    return [
      !!appcredz,
      {
        clientId: appcredz?.clientId,
        clientSecret: appcredz?.clientSecret,
      },
    ];
  }, [appcredz]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <Formik initialValues={initialValues}>
          <Form autoComplete="off">
            <DialogTitle id="form-dialog-title">
              {t('Created credentials')}
            </DialogTitle>
            <Box p={1}>
              <DialogContent>
                <DialogContentText>
                  {t(
                    'Copy the credentials below and keep them safe. You won\'t be able to retrieve them again.'
                  )}
                </DialogContentText>
                <Box minHeight={100} minWidth={500}>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <TextField label={t('clientId')} name="clientId" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label={t('clientSecret')}
                        name="clientSecret"
                        multiline
                        maxRows={5}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleClose}
                >
                  {t('Close')}
                </Button>
              </DialogActions>
            </Box>
          </Form>
        </Formik>
      </Dialog>
    </>
  );
});

const Members = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [ConfirmDialog, setMemberToRemove, memberToRemove] = useConfirmDialog();
  const [AppConfirmDialog, setAppToRemove, appToRemove] = useConfirmDialog();
  const [updating, setUpdating] = useState();
  const [appcredz, setAppCredz] = useState();

  const onAddMember = useCallback(
    async (member) => {
      const updatedMembers = [...store.organization.selected.members, member];
      await onSubmit({
        members: updatedMembers,
      });
    },
    [onSubmit, store.organization.selected.members]
  );

  const closeAppCredzDialog = useCallback(async () => setAppCredz(null), []);

  const onAddApplication = useCallback(
    async (app) => {
      if (!store.user.isAdministrator) {
        return;
      }

      // create app credentials
      const { status, data: appCredz } =
        await store.organization.createAppCredentials(app);
      switch (status) {
        case 200: {
          // save them
          const updatedApps = [
            ...store.organization.selected.applications,
            { ...app, ...appCredz },
          ];
          await onSubmit({
            applications: updatedApps,
          });
          return setAppCredz(appCredz);
        }
        case 422:
          return store.pushToastMessage({
            message: t('Some fields are missing'),
            severity: 'error',
          });
        default:
          return store.pushToastMessage({
            message: t('Something went wrong'),
            severity: 'error',
          });
      }
    },
    [onSubmit, store, t]
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

  const removeApplication = useCallback(
    async (app) => {
      setUpdating(app);
      const updatedApps = store.organization.selected.applications.filter(
        ({ clientId }) => clientId !== app.clientId
      );
      await onSubmit({
        applications: updatedApps,
      });
      setUpdating();
    },
    [onSubmit, store.organization.selected.applications]
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
    <>
      <Section label={t('Collaborators')}>
        <Box py={2}>
          <MemberFormDialog
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
                          <div>
                            <WarningIcon fontSize="small" />
                          </div>
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
      </Section>
      <Section label={t('Applications')}>
        <Box py={2}>
          <ApplicationFormDialog
            applications={store.organization.selected?.applications}
            onSubmit={onAddApplication}
          />
          <ApplicationShowDialog
            appcredz={appcredz}
            onClose={closeAppCredzDialog}
          />
        </Box>
        <Paper variant="outlined" square>
          <Table aria-label="member table">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>
                  <Typography>{t('Application')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>{t('Expiration')}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography>{t('Role')}</Typography>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(store.organization.selected?.applications || []).map((app) => {
                const expiryMoment = moment(app.expiryDate);
                const dateFormat = moment.localeData().longDateFormat('L');
                const isExpired = moment().isSameOrAfter(expiryMoment);
                return (
                  <TableRow hover size="small" key={app.clientId}>
                    <TableCell align="center">
                      {updating === app ? (
                        <CircularProgress size={20} />
                      ) : isExpired ? (
                        <LinkOffIcon />
                      ) : (
                        <LinkIcon />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography noWrap>{app.name}</Typography>
                      {isExpired ? (
                        <Box
                          color="warning.dark"
                          display="flex"
                          alignItems="center"
                        >
                          <div>
                            <WarningIcon fontSize="small" />
                          </div>
                          <Box pl={1}>
                            <Typography noWrap>
                              {t('Token is expired')}
                            </Typography>
                          </Box>
                        </Box>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Typography noWrap>
                        {expiryMoment.format(dateFormat)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography noWrap>{t(app.role)}</Typography>
                    </TableCell>
                    <TableCell>
                      <RestrictIconButton
                        aria-label="delete"
                        onClick={() => setAppToRemove(app)}
                        disabled={!!updating}
                      >
                        <DeleteIcon fontSize="small" />
                      </RestrictIconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <AppConfirmDialog
            title={t('Are you sure to remove this application?')}
            subTitle={appToRemove.name}
            onConfirm={removeApplication}
          />
        </Paper>
      </Section>
    </>
  );
});

export default Members;
