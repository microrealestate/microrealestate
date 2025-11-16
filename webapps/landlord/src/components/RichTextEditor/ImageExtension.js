import { apiFetcher } from '../../utils/fetch';
import { Image } from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

const ImageExtension = Image.extend({
  addAttributes() {
    return {
      src: {
        default: null
      },
      alt: {
        default: null
      },
      title: {
        default: null
      },
      width: {
        default: null
      },
      height: {
        default: null
      },
      // A custom attribute to be able to query the image
      // to trigger a custom fetch logic if needed.
      // Currently used for rendering the signature
      'data-template-id': {
        default: null
      }
    };
  },

  renderHTML({ HTMLAttributes }) {
    // If the image is the signature, fetch it
    if (HTMLAttributes['data-template-id'] === 'template.landlord.signature') {
      apiFetcher()
        .get(`/documents/${encodeURIComponent(HTMLAttributes.src)}`, {
          responseType: 'blob'
        })
        .then((response) => {
          const img = document.querySelector(
            "img[data-template-id='template.landlord.signature']"
          );
          const imgUrl = URL.createObjectURL(response.data);
          if (img) {
            img.onload = () => {
              URL.revokeObjectURL(imgUrl);
            };
            img.src = imgUrl;
          }
        });
    }

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)
    ];
  }
});

export default ImageExtension;
