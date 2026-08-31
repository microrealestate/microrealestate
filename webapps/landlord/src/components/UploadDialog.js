import { DateField } from '@microrealestate/commonui/components/formfields/DateField';
import { UploadField } from '@microrealestate/commonui/components/formfields/UploadField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { SUPPORTED_MIMETYPES, UPLOAD_MAX_SIZE } from '@microrealestate/shared';
import { Form, Formik } from 'formik';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useMediaQuery } from 'usehooks-ts';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';
import ResponsiveDialog from '../components/ResponsiveDialog';
import { uploadDocument } from '../utils/fetch';
import DocumentViewer from './DocumentViewer/DocumentViewer';

const validationSchema = Yup.object().shape({
  template: Yup.object().required(),
  description: Yup.string(),
  expiryDate: Yup.mixed()
    .when('template', (template, schema) => {
      return template?.hasExpiryDate ? schema.required() : schema;
    })
    .test('expiryDate', 'Date is invalid', (value) => {
      if (value) {
        return moment(value).isValid();
      }
      return true;
    }),
  file: Yup.mixed()
    .nullable()
    .required()
    .test(
      'UPLOAD_MAX_SIZE',
      'File is too big. Maximum size is 25Mo.',
      (value) => value && value.size <= UPLOAD_MAX_SIZE
    )
    .test(
      'FILE_FORMAT',
      'File is not allowed. Only images or pdf are accepted.',
      (value) => value && SUPPORTED_MIMETYPES.includes(value.type)
    )
});

const defaultValues = {
  template: '',
  description: '',
  file: '',
  expiryDate: null
};

export default function UploadDialog({ open, setOpen, data, onSave }) {
  const t = useTranslations('common');
  const store = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [localFile, setLocalFile] = useState(null);
  const formRef = useRef();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const initialValues = {
    ...defaultValues,
    template: data || ''
  };

  useEffect(() => {
    if (!open) {
      setLocalFile(null);
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setLocalFile(null);
  };

  const handleFileChange = (event, setFieldValue) => {
    const file = event.target.files?.length ? event.target.files[0] : null;
    setLocalFile(file);
    setFieldValue('file', file);
  };

  const _onSubmit = async (doc, { resetForm }) => {
    try {
      setIsLoading(true);
      doc.name = doc.template.name;
      doc.description = doc.template.description;
      const folder = [
        store.tenant.selected.name.replace(/[/\\]/g, '_'),
        'contract_scanned_documents'
      ].join('/');

      doc.mimeType = doc.file.type;

      try {
        const response = await uploadDocument({
          endpoint: '/documents/upload',
          documentName: doc.name,
          file: doc.file,
          folder
        });

        doc.url = response.data.key;
      } catch (error) {
        console.error(error);
        toast.error(t('Cannot upload document'));
        return;
      }

      try {
        await onSave(doc);
        resetForm();
        handleClose();
      } catch (error) {
        console.error(error);
        toast.error(t('Cannot save document'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      isLoading={isLoading}
      title={t('Document to upload')}
      renderContent={() => (
        <div className="flex flex-col size-full sm:flex-row sm:w-[80vw] sm:h-[80vh]">
          {isDesktop ? (
            <div className="w-2/3">
              <DocumentViewer localFile={localFile} />
            </div>
          ) : null}
          <div className="w-full md:w-1/3 px-4">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={_onSubmit}
              innerRef={formRef}
            >
              {({ values, setFieldValue }) => {
                return (
                  <Form autoComplete="off" className="mt-4 space-y-4">
                    <div className="-mt-4 mb-8">
                      <div>{data.name}</div>
                      {data.description ? (
                        <div className="text-muted-foreground">
                          {data.description}
                        </div>
                      ) : null}
                    </div>
                    <UploadField
                      label={t('File')}
                      name="file"
                      onChange={(event) =>
                        handleFileChange(event, setFieldValue)
                      }
                    />
                    {values.template?.hasExpiryDate && (
                      <DateField label={t('Expiry date')} name="expiryDate" />
                    )}
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      )}
      renderFooter={() => (
        <>
          <Button
            variant="outline"
            onClick={() => {
              formRef.current.resetForm();
              handleClose();
            }}
          >
            {t('Cancel')}
          </Button>
          <Button onClick={() => formRef.current.submitForm()}>
            {t('Upload')}
          </Button>
        </>
      )}
    />
  );
}
