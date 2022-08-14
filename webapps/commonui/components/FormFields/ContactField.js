import { Grid } from '@material-ui/core';
import { TextField } from './TextField';
import useTranslation from 'next-translate/useTranslation';

export function ContactField({
  contactName,
  emailName,
  phone1Name,
  phone2Name,
  disabled,
}) {
  const { t } = useTranslation('common');
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label={t('Contact')}
          name={contactName || 'contact'}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label={t('Email')}
          name={emailName || 'email'}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label={t('Phone 1')}
          name={phone1Name || 'phone1'}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label={t('Phone 2')}
          name={phone2Name || 'phone2'}
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
}
