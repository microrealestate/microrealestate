import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import apiClient from '../../utils/apiClient';
import Loading from '../Loading';
import ImageViewer from './ImageViewer/ImageViewer';
import Toolbar from './Toolbar';

const DynPdfViewer = dynamic(() => import('./PdfViewer/PdfViewer'), {
  ssr: false
});

// eslint-disable-next-line react/display-name
const PdfViewer = forwardRef((props, ref) => (
  <DynPdfViewer {...props} forwardRef={ref} />
));

function fetchLocalDocument(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const blob = new Blob([reader.result], { type: file.type });
        const url = URL.createObjectURL(blob);
        resolve(url);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function DocumentViewer({ localFile, serverFile }) {
  const imageViewerRef = useRef();
  const pdfViewerRef = useRef();
  const [fileUrl, setFileUrl] = useState();
  const [isPdfDocument, setIsPdfDocument] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const t = useTranslations('common');

  useEffect(() => {
    async function fetchDocument() {
      try {
        let url;
        let type;
        setIsLoading(true);
        if (localFile) {
          url = await fetchLocalDocument(localFile);
          type = localFile.type;
        } else if (serverFile) {
          const response = await apiClient.get(serverFile.url, {
            responseType: 'blob'
          });
          url = URL.createObjectURL(response.data);
          type = serverFile.mimeType;
        }
        setIsPdfDocument(type === 'application/pdf');
        setFileUrl(url);
      } catch (error) {
        setFileUrl();
        console.error(error);
        toast.error(t('Document not found'));
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocument();
  }, [localFile, serverFile, t]);

  useEffect(() => {
    if (!(localFile || serverFile) && fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl, localFile, serverFile]);

  const handleZoomIn = () => {
    const viewerRef = isPdfDocument ? pdfViewerRef : imageViewerRef;
    viewerRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    const viewerRef = isPdfDocument ? pdfViewerRef : imageViewerRef;
    viewerRef.current?.zoomOut();
  };

  const handleRotateLeft = () => {
    const viewerRef = isPdfDocument ? pdfViewerRef : imageViewerRef;
    viewerRef.current?.rotateLeft();
  };

  const handleRotateRight = () => {
    const viewerRef = isPdfDocument ? pdfViewerRef : imageViewerRef;
    viewerRef.current?.rotateRight();
  };

  return (
    <div className="size-full bg-primary/5 border flex items-center justify-center">
      {isLoading ? (
        <Loading fullScreen={false} className="size-8" />
      ) : fileUrl ? (
        <div className="relative size-full">
          <Toolbar
            showRotate={!isPdfDocument}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRotateLeft={handleRotateLeft}
            onRotateRight={handleRotateRight}
            className="absolute top-0 w-full"
          />
          {isPdfDocument ? (
            <PdfViewer
              ref={pdfViewerRef}
              fileUrl={fileUrl}
              className="absolute top-14 bottom-2 w-full"
            />
          ) : (
            <ImageViewer
              ref={imageViewerRef}
              fileUrl={fileUrl}
              className="absolute top-14 bottom-2 w-full"
            />
          )}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          {t('No document selected')}
        </div>
      )}
    </div>
  );
}
