import { useCallback, useEffect, useState } from 'react';

import { apiFetcher } from '../../utils/fetch';
import Lightbox from 'react-awesome-lightbox';
import Loading from '../Loading';
import { useToast } from '../../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

export default function ImageViewer({ open, setOpen }) {
  const [imageSrc, setImageSrc] = useState();
  const { t } = useTranslation('common');
  const [Toast, setToastMessage, toastVisible] = useToast();

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
          console.error(error);
          setToastMessage(t('Document not found'));
        }
      }
    })();
  }, [
    //t,
    open,
    setToastMessage,
  ]);

  if (open && imageSrc) {
    return (
      <Lightbox image={imageSrc} title={open.title} onClose={handleClose} />
    );
  }
  if (open && !imageSrc && !toastVisible) {
    return <Loading fullScreen />;
  }

  return <Toast severity="error" onClose={handleClose} />;
}
