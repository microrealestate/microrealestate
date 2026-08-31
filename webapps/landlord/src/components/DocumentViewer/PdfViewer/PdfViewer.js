import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { useImperativeHandle, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ fileUrl, className, forwardRef }) {
  const t = useTranslations('common');
  const [numPages, setNumPages] = useState();
  const [scale, setScale] = useState(0.8);
  const [rotate, setRotate] = useState(0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  useImperativeHandle(
    forwardRef,
    () => ({
      zoomIn: () => {
        if (scale >= 2) {
          return;
        }
        setScale(scale + 0.1);
      },
      zoomOut: () => {
        if (scale <= 0.5) {
          return;
        }
        setScale(scale - 0.1);
      },
      rotateLeft: () => {
        setRotate(rotate - 90);
      },
      rotateRight: () => {
        setRotate(rotate + 90);
      }
    }),
    [scale, rotate]
  );

  return fileUrl ? (
    <div className={cn('overflow-auto', className)}>
      <Document
        file={fileUrl}
        loading={t('Processing...')}
        onLoadSuccess={onDocumentLoadSuccess}
        rotate={rotate}
        className="space-y-4"
      >
        {Array.apply(null, Array(numPages))
          .map((_, i) => i + 1)
          .map((page, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={page}
              scale={scale}
              className={'mx-auto w-fit border'}
            />
          ))}
      </Document>
    </div>
  ) : null;
}
