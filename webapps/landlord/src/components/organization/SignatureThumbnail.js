import { useEffect, useState } from 'react';
import { apiFetcher } from '../../utils/fetch';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils';
import Image from 'next/image';
import { LuTrash } from 'react-icons/lu';
import useTranslation from 'next-translate/useTranslation';

export default function SignatureThumbnail({
  signature,
  onRemove,
  disabled,
  className
}) {
  const { t } = useTranslation('common');
  const [imageSrc, setImageSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let fetchedImageSrc;
    const fetchSignatureImage = async () => {
      try {
        // Extract filename from the full path
        const response = await apiFetcher().get(
          `/documents/${encodeURIComponent(signature)}`,
          {
            responseType: 'blob'
          }
        );

        // Create a blob URL for the image
        fetchedImageSrc = URL.createObjectURL(response.data);
        setImageSrc(fetchedImageSrc);
        setHasError(false);
      } catch (error) {
        console.error('Failed to load signature image:', error);
        setImageSrc(null);
        setHasError(true);
      }
    };

    if (signature) {
      fetchSignatureImage();
    }

    // Cleanup blob URL when component unmounts
    return () => {
      if (fetchedImageSrc) {
        URL.revokeObjectURL(fetchedImageSrc);
      }
    };
  }, [signature]);

  return signature ? (
    <div className={cn('space-y-2', className)}>
      <div className="text-muted-foreground text-xs">{t('Signature')}</div>
      <div className="flex items-center gap-2">
        {!hasError && imageSrc ? (
          <div className="w-full max-w-xs h-40 mb-2 relative">
            <Image
              src={imageSrc}
              fill
              alt={t('Current signature')}
              onError={() => setHasError(true)}
              className="object-contain"
            />
          </div>
        ) : null}
        {hasError ? (
          <div className="flex items-center justify-center w-80 h-40 mb-2 border-dashed border-2 border-muted text-destructive">
            {t('Failed to load signature image')}
          </div>
        ) : null}
        <Button
          variant="secondary"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          data-cy="removeSignatureButton"
        >
          <LuTrash className="size-4" />
        </Button>
      </div>
    </div>
  ) : null;
}
