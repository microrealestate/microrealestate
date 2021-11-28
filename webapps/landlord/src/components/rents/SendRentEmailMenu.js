import {
  AlertIllustration,
  Pending2Illustration,
  PendingIllustration,
  ReceiptIllustration,
} from '../Illustrations';
import { memo, useCallback, useContext } from 'react';

import FullScreenDialogMenu from '../FullScreenDialogMenu';
import SendIcon from '@material-ui/icons/Send';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

const SendRentEmailMenu = ({ period, tenant, terms, onError, ...props }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const onSend = useCallback(
    async (docName) => {
      const sendStatus = await store.rent.sendEmail({
        document: docName,
        tenantIds: [tenant._id],
        terms,
      });
      if (sendStatus !== 200) {
        // TODO check error code to show a more detailed error message
        return onError(t('Email service cannot send emails'));
      }

      const response = await store.rent.fetch();
      if (response.status !== 200) {
        // TODO check error code to show a more detail error message
        return onError(t('Cannot fetch rents from server'));
      }
    },
    [store.rent, tenant, terms, onError]
  );

  return (
    <FullScreenDialogMenu
      variant="contained"
      buttonLabel={t('Send email')}
      dialogTitle={t('Send a billing email to {{tenantName}}', {
        tenantName: tenant.name,
      })}
      size="small"
      startIcon={<SendIcon />}
      menuItems={[
        {
          category: t('Reminder notices'),
          label: t('First notice'),
          illustration: <PendingIllustration />,
          value: 'rentcall',
        },
        {
          category: t('Reminder notices'),
          label: t('Second notice'),
          illustration: <Pending2Illustration />,
          value: 'rentcall_reminder',
        },
        {
          category: t('Reminder notices'),
          label: t('Last notice'),
          illustration: <AlertIllustration />,
          value: 'rentcall_last_reminder',
        },
        {
          category: t('Invoice'),
          label: t('Invoice'),
          illustration: <ReceiptIllustration />,
          value: 'invoice',
        },
      ]}
      onClick={onSend}
      {...props}
    />
  );
};

export default memo(SendRentEmailMenu);
