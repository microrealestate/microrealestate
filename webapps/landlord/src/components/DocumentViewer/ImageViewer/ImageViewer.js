import { forwardRef, useImperativeHandle, useRef } from 'react';
import Lightbox from 'react-awesome-lightbox';

function ImageViewer({ fileUrl, className }, ref) {
  const viewerRef = useRef();

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const elements = viewerRef.current.getElementsByClassName('zoomin');
      if (elements.length) {
        const zoomInBtn = elements[0];
        zoomInBtn.click();
      }
    },
    zoomOut: () => {
      const elements = viewerRef.current.getElementsByClassName('zoomout');
      if (elements.length) {
        const zoomOutBtn = elements[0];
        zoomOutBtn.click();
      }
    },
    rotateLeft: () => {
      const elements = viewerRef.current.getElementsByClassName('rotatel');
      if (elements.length) {
        const rotateLeftBtn = elements[0];
        rotateLeftBtn.click();
      }
    },
    rotateRight: () => {
      const elements = viewerRef.current.getElementsByClassName('rotater');
      if (elements.length) {
        const rotateRightBtn = elements[0];
        rotateRightBtn.click();
      }
    }
  }));

  return fileUrl ? (
    <div ref={viewerRef} className={className}>
      <Lightbox image={fileUrl} showTitle={false} />
    </div>
  ) : null;
}

export default forwardRef(ImageViewer);
