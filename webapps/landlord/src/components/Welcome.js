import { StoreContext } from '../store';
import { Typography } from '@material-ui/core';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function Welcome() {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  return (
    <Typography component="h1" variant="h5">
      {t('Welcome {{firstName}} {{lastName}}!', {
        firstName: store.user.firstName,
        lastName: store.user.lastName,
      })}
    </Typography>
  );
}
