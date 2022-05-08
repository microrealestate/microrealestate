import { useCallback, useContext, useEffect, useState } from 'react';

import { apiFetcher } from '../../utils/fetch';
import Lightbox from 'react-awesome-lightbox';
import Loading from '../Loading';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

export default function ImageViewer({ open, setOpen }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [imageSrc, setImageSrc] = useState();

  const handleClose = useCallback(() => {
    setImageSrc();
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    (async () => {
      if (open?.url) {
        try {
          const response = await apiFetcher().get(open.url, {
            responseType: 'blob',
          });
          setImageSrc(URL.createObjectURL(response.data));
        } catch (error) {
          handleClose();
          console.error(error);
          store.pushToastMessage({
            message: t('Document not found'),
            severity: 'error',
          });
        }
      }
    })();
  }, [t, open, store, handleClose]);

  if (open && imageSrc) {
    return (
      <Lightbox image={imageSrc} title={open.title} onClose={handleClose} />
    );
  }
  if (open && !imageSrc) {
    return <Loading fullScreen />;
  }

  return null;
}
