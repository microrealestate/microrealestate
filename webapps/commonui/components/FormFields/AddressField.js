import { Grid } from '@material-ui/core';
import { TextField } from './TextField';
import useTranslation from 'next-translate/useTranslation';

export function AddressField({ disabled }) {
  const { t } = useTranslation('common');
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label={t('Street 1')}
          name="address.street1"
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label={t('Street 2')}
          name="address.street2"
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={t('Zip code')}
          name="address.zipCode"
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField label={t('City')} name="address.city" disabled={disabled} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={t('State')}
          name="address.state"
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={t('Country')}
          name="address.country"
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
}
