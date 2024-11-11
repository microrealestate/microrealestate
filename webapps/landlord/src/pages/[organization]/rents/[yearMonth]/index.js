import { fetchRents, QueryKeys } from '../../../../utils/restcalls';
import { LuAlertTriangle, LuChevronDown, LuSend } from 'react-icons/lu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../../../../components/ui/popover';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '../../../../components/ui/alert';
import { Button } from '../../../../components/ui/button';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import { GrDocumentPdf } from 'react-icons/gr';
import { List } from '../../../../components/ResourceList';
import { LuRotateCw } from 'react-icons/lu';
import moment from 'moment';
import Page from '../../../../components/Page';
import { RentOverview } from '../../../../components/rents/RentOverview';
import RentTable from '../../../../components/rents/RentTable';
import { StoreContext } from '../../../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

function _filterData(data, filters) {
  let filteredItems =
    filters.statuses?.length > 0
      ? data.rents.filter(({ status }) => filters.statuses.includes(status))
      : data.rents;

  if (filters.searchText) {
    const regExp = /\s|\.|-/gi;
    const cleanedSearchText = filters.searchText
      .toLowerCase()
      .replace(regExp, '');

    filteredItems = filteredItems.filter(
      ({ occupant: { isCompany, name, manager, contacts }, payments }) => {
        // Search match name
        let found =
          name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) !=
          -1;

        // Search match manager
        if (!found && isCompany) {
          found =
            manager
              .replace(regExp, '')
              .toLowerCase()
              .indexOf(cleanedSearchText) != -1;
        }

        // Search match contact
        if (!found) {
          found = !!contacts
            ?.map(({ contact = '', email = '', phone = '' }) => ({
              contact: contact.replace(regExp, '').toLowerCase(),
              email: email.toLowerCase(),
              phone: phone.replace(regExp, '')
            }))
            .filter(
              ({ contact, email, phone }) =>
                contact.indexOf(cleanedSearchText) != -1 ||
                email.indexOf(cleanedSearchText) != -1 ||
                phone.indexOf(cleanedSearchText) != -1
            ).length;
        }

        // Search match in payment references
        if (!found) {
          found = !!payments?.find(
            ({ reference = '' }) =>
              reference
                .replace(regExp, '')
                .toLowerCase()
                .indexOf(cleanedSearchText) != -1
          );
        }

        return found;
      }
    );
  }
  return filteredItems;
}

function Actions({ values, onDone }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [sending, setSending] = useState(false);
  const [showConfirmDlg, setShowConfirmDlg] = useState(false);
  const [selectedDocumentName, setSelectedDocumentName] = useState(null);
  const disabled = !values?.length;

  const handleAction = useCallback(
    (docName) => async () => {
      setSelectedDocumentName(docName);
      setShowConfirmDlg(true);
    },
    [setSelectedDocumentName, setShowConfirmDlg]
  );

  const handleConfirm = useCallback(async () => {
    try {
      setSending(true);

      const sendStatus = await store.rent.sendEmail({
        document: selectedDocumentName,
        tenantIds: values.map((r) => r._id),
        terms: values.map((r) => r.term)
      });

      if (sendStatus !== 200) {
        return toast.error(t('Email delivery service cannot send emails'));
      }

      const response = await store.rent.fetch();
      if (response.status !== 200) {
        return toast.error(t('Cannot fetch rents from server'));
      }

      onDone?.();
    } finally {
      setSending(false);
    }
  }, [onDone, selectedDocumentName, store.rent, t, values]);

  return (
    <>
      {sending ? (
        <div className="flex items-center gap-1 text-muted-foreground">
          <LuRotateCw className="animate-spin size-4" />
          {t('Sending...')}
        </div>
      ) : (
        <div className="flex flex-col">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" disabled={disabled}>
                <LuSend className="mr-2" />
                {t('Send by email')}
                <LuChevronDown className="ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0.5 m-0 w-auto">
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  onClick={handleAction('invoice')}
                  disabled={disabled}
                  className="justify-start w-full rounded-none"
                >
                  <GrDocumentPdf className="mr-2" /> {t('Invoice')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleAction('rentcall')}
                  disabled={disabled}
                  className="justify-start w-full rounded-none"
                >
                  <GrDocumentPdf className="mr-2" /> {t('First payment notice')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleAction('rentcall_reminder')}
                  className="justify-start w-full rounded-none text-warning"
                >
                  <GrDocumentPdf className="mr-2 " />{' '}
                  {t('Second payment notice')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleAction('rentcall_last_reminder')}
                  className="justify-start w-full rounded-none text-destructive"
                >
                  <GrDocumentPdf className="mr-2" /> {t('Last payment notice')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {selectedDocumentName ? (
        <ConfirmDialog
          title={t('Are you sure to send "{{docName}}"?', {
            docName: t(selectedDocumentName)
          })}
          open={showConfirmDlg}
          setOpen={setShowConfirmDlg}
          data={selectedDocumentName}
          onConfirm={handleConfirm}
        >
          <div className="mb-2">{t('Tenants selected')}</div>
          <div className="flex flex-col gap-1 pl-4 text-sm max-h-48 overflow-auto">
            {values.map((tenant) => (
              <div key={tenant._id}>{tenant.occupant.name}</div>
            ))}
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}

function Rents() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const store = useContext(StoreContext);
  const router = useRouter();
  const { yearMonth } = router.query;
  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.RENTS, yearMonth],
    queryFn: () => fetchRents(store, yearMonth)
  });
  const [rentSelected, setRentSelected] = useState([]);

  const handleActionDone = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QueryKeys.RENTS, yearMonth] });
    setRentSelected([]);
  }, [queryClient, yearMonth]);

  const period = useMemo(
    () =>
      router.query.yearMonth ? moment(router.query.yearMonth, 'YYYY.MM') : null,
    [router.query.yearMonth]
  );

  if (isError) {
    toast.error(t('Error fetching rents'));
  }

  return (
    <Page loading={isLoading} dataCy="rentsPage">
      <div className="my-4">
        <RentOverview data={{ period, ...data?.overview }} />
      </div>

      {!store.organization.canSendEmails ? (
        <Alert variant="warning" className="mb-4">
          <div className="flex items-center gap-4">
            <LuAlertTriangle className="size-6" />
            <div className="text-sm">
              {t(
                'Unable to send documents by email without configuring the mail service in Settings page'
              )}
            </div>
          </div>
        </Alert>
      ) : null}
      <List
        data={data}
        filters={[
          { id: 'notpaid', label: t('Not paid') },
          { id: 'partiallypaid', label: t('Partially paid') },
          { id: 'paid', label: t('Paid') }
        ]}
        filterFn={_filterData}
        renderActions={() =>
          store.organization.canSendEmails ? (
            <Actions values={rentSelected} onDone={handleActionDone} />
          ) : null
        }
        renderList={({ data }) => (
          <RentTable
            rents={data}
            selected={rentSelected}
            setSelected={setRentSelected}
          />
        )}
      />
    </Page>
  );
}

export default withAuthentication(Rents);
