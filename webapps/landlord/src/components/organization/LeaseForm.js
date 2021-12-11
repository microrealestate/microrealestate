import * as Yup from 'yup';

import { Box, Grid, Typography } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { FormSection, FormTextField, SelectField, SubmitButton } from '../Form';
import { useContext, useMemo } from 'react';

import { ADMIN_ROLE } from '../../store/User';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

const allowedRoles = [ADMIN_ROLE];

const timeRanges = ['days', 'weeks', 'months', 'years'];

const LeaseForm = ({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        name: Yup.string()
          .notOneOf(
            store.lease.items
              .filter(({ _id }) => store.lease.selected?._id !== _id)
              .map(({ name }) => name)
          )
          .required(),
        description: Yup.string(),
        numberOfTerms: Yup.number().integer().min(1).required(),
        timeRange: Yup.string().required(),
        active: Yup.boolean().required(),
      }),
    [store.lease.selected, store.lease.items]
  );

  const initialValues = useMemo(() => {
    return {
      name: store.lease.selected?.name || '',
      description: store.lease.selected?.description || '',
      numberOfTerms: store.lease.selected?.numberOfTerms || '',
      timeRange: store.lease.selected?.timeRange || '',
      active: store.lease.selected?.active || true,
      system: store.lease.selected?.system || false,
    };
  }, [store.lease.selected]);

  return (
    <Box p={5}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, isSubmitting }) => {
          return (
            <Form autoComplete="off">
              <FormSection label={t('Contract information')}>
                {values.usedByTenants && (
                  <Box color="warning.dark">
                    <Typography>
                      {t(
                        'This contract is currently used, only name and description fields can be updated'
                      )}
                    </Typography>
                  </Box>
                )}

                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <FormTextField
                      label={t('Name')}
                      name="name"
                      onlyRoles={allowedRoles}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormTextField
                      label={t('Number of terms')}
                      name="numberOfTerms"
                      disabled={values.usedByTenants}
                      onlyRoles={allowedRoles}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <SelectField
                      label={t('Schedule type')}
                      name="timeRange"
                      values={timeRanges.map((timeRange) => ({
                        id: timeRange,
                        label: t(timeRange),
                        value: timeRange,
                      }))}
                      disabled={values.usedByTenants}
                      onlyRoles={allowedRoles}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormTextField
                      label={t('Description')}
                      name="description"
                      multiline
                      rows={2}
                      onlyRoles={allowedRoles}
                    />
                  </Grid>
                </Grid>
              </FormSection>
              <SubmitButton
                label={!isSubmitting ? t('Save') : t('Submitting')}
                onlyRoles={allowedRoles}
              />
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};

export default observer(LeaseForm);
