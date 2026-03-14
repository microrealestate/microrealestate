import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useEffect, useState } from 'react';

import { apiFetcher } from '../../utils/fetch';
import PropertyIcon from './PropertyIcon';

export default function PropertyAvatar({ property }) {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    const loadPropertyImage = async () => {
      setImageUrl('');

      if (!property?._id) {
        return;
      }

      try {
        let attachmentId = property.coverPhotoAttachmentId;

        if (!attachmentId) {
          const attachmentsResponse = await apiFetcher().get('/attachments', {
            params: {
              targetType: 'property',
              targetId: property._id
            }
          });

          const imageAttachment = (attachmentsResponse.data || []).find(
            (attachment) => attachment?.mimeType?.startsWith('image/')
          );
          attachmentId = imageAttachment?._id;
        }

        if (!attachmentId) {
          return;
        }

        const imageResponse = await apiFetcher().get(
          `/attachments/${attachmentId}/download`,
          { responseType: 'blob' }
        );

        objectUrl = window.URL.createObjectURL(imageResponse.data);
        if (!cancelled) {
          setImageUrl(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setImageUrl('');
        }
      }
    };

    loadPropertyImage();

    return () => {
      cancelled = true;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [property?._id, property?.coverPhotoAttachmentId]);

  return (
    <Avatar className="size-14">
      {imageUrl ? (
        <AvatarImage src={imageUrl} alt={property?.name || 'Property photo'} />
      ) : null}
      <AvatarFallback className="bg-primary/20 font-medium">
        <PropertyIcon type={property.type} />
      </AvatarFallback>
    </Avatar>
  );
}
