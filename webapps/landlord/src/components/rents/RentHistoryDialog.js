import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@microrealestate/commonui/components/ui/accordion';
import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader
} from '@microrealestate/commonui/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import { cn } from '@microrealestate/commonui/utils';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuPencil } from 'react-icons/lu';
import { toast } from 'sonner';
import { useStore } from '@/providers/StoreProvider';
import { getPeriod } from '../../utils';
import Loading from '../Loading';
import NewPaymentDialog from '../payment/NewPaymentDialog';
import RentDetails from './RentDetails';

function RentListItem({ rent, tenant, isSelected, onClick }) {
  const t = useTranslations('common');

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      onClick?.(event);
    },
    [onClick]
  );

  return (
    <Card
      className={cn(
        'p-2 cursor-pointer',
        isSelected ? 'border-primary border-2' : ''
      )}
      onClick={handleClick}
      data-cy="rentCard"
      data-cy-term={rent.term}
      data-is-selected={isSelected}
    >
      <CardHeader className="flex flex-row justify-between items-center">
        <div className="text-xl">
          {getPeriod(t, rent.term, tenant.occupant.frequency)}
        </div>
        <div>
          <Button variant="ghost" size="icon" onClick={handleClick}>
            <LuPencil />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <RentDetails rent={rent} />
      </CardContent>
    </Card>
  );
}

function YearRentList({ tenant, year, selected, onClick }) {
  const rents =
    tenant.rents?.filter(({ term }) => String(term).slice(0, 4) === year) || [];

  const handleClick = useCallback(
    ({ occupant }, rent) =>
      () => {
        onClick({ _id: occupant._id, ...rent, occupant });
      },
    [onClick]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 w-full">
      {rents?.map((rent) => {
        return (
          <RentListItem
            key={rent.term}
            rent={rent}
            tenant={tenant}
            isSelected={rent.term === selected?.term}
            onClick={handleClick(tenant, rent)}
          />
        );
      })}
    </div>
  );
}

function RentHistory({ tenantId, selectedTerm }) {
  const t = useTranslations('common');
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState();
  const [rentYears, setRentYears] = useState([]);
  const [openNewPaymentDialog, setOpenNewPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const defaultExpandedYear = useMemo(() => {
    if (selectedPayment?.term) {
      return String(selectedPayment.term).slice(0, 4);
    }

    if (selectedTerm) {
      return String(selectedTerm).slice(0, 4);
    }
    const year = String(moment().year());
    if (rentYears.length && !rentYears.includes(year)) {
      return String(rentYears[rentYears.length - 1]);
    }

    return year;
  }, [rentYears, selectedPayment, selectedTerm]);

  const fetchTenantRents = useCallback(
    async (showLoadingAnimation = true) => {
      showLoadingAnimation && setLoading(true);
      const response = await store.rent.fetchTenantRents(tenantId);
      if (response.status !== 200) {
        toast.error(t('Cannot get tenant information'));
      } else {
        const tenant = response.data;
        setTenant(tenant);
        setRentYears(
          Array.from(
            tenant.rents.reduce((acc, { term }) => {
              acc.add(String(term).slice(0, 4));
              return acc;
            }, new Set())
          )
        );
        if (!selectedPayment) {
          const currentTerm =
            String(selectedTerm) ||
            moment().startOf(tenant.occupant.frequency).format('YYYYMMDDHH');

          const currentRent = tenant.rents.find(
            ({ term }) => String(term) === currentTerm
          );
          setSelectedPayment(currentRent);
        }
      }
      showLoadingAnimation && setLoading(false);
    },
    [selectedPayment, selectedTerm, store.rent, t, tenantId]
  );

  useEffect(() => {
    fetchTenantRents();
  }, [fetchTenantRents]);

  useEffect(() => {
    if (loading) return;
    // scroll to data-is-selected element
    const selectedElement = document.querySelector('[data-is-selected="true"]');
    selectedElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, [loading]);

  const handleClick = (rent) => {
    setSelectedPayment(rent);
    setOpenNewPaymentDialog(true);
  };

  const handleClose = () => {
    fetchTenantRents(false);
  };

  return (
    <>
      <NewPaymentDialog
        open={openNewPaymentDialog}
        setOpen={setOpenNewPaymentDialog}
        data={selectedPayment}
        onClose={handleClose}
      />
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="text-xl font-semibold">{tenant.occupant.name}</div>
          {tenant.occupant.beginDate && tenant.occupant.endDate && (
            <div
              className="text-muted-foreground text-xs"
              data-cy="contractDates"
              data-cy-begin-date={tenant.occupant.beginDate}
              data-cy-end-date={tenant.occupant.endDate}
            >
              {t('Contract from {beginDate} to {endDate}', {
                beginDate: moment(tenant.occupant.beginDate).format('L'),
                endDate: moment(tenant.occupant.endDate).format('L')
              })}
            </div>
          )}
          <div className="border rounded overflow-y-auto mt-8 px-4 bg-card">
            <Accordion
              type="single"
              collapsible
              defaultValue={defaultExpandedYear}
              className="h-full"
            >
              {rentYears.map((year) => {
                return (
                  <AccordionItem
                    key={year}
                    value={year}
                    data-cy="rentYearAccordion"
                    data-cy-year={year}
                    className="last:border-0"
                  >
                    <AccordionTrigger className="text-lg">
                      {year}
                    </AccordionTrigger>
                    <AccordionContent>
                      <YearRentList
                        tenant={tenant}
                        year={year}
                        selected={selectedPayment}
                        onClick={handleClick}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </>
      )}
    </>
  );
}

export default function RentHistoryDialog({
  open,
  setOpen,
  data: { tenant, selectedTerm }
}) {
  const t = useTranslations('common');
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  return (
    <Drawer open={open} dismissible={false}>
      <DrawerContent
        className="p-4"
        fullScreen
        hideHandle
        data-cy="rentHistoryDialog"
      >
        <DrawerHeader className="flex flex-row justify-between p-0">
          <DrawerTitle className="sr-only">{t('Rent schedule')}</DrawerTitle>
          <span className="text-xl font-semibold">{t('Rent schedule')}</span>
          <Button variant="secondary" onClick={handleClose}>
            {t('Close')}
          </Button>
        </DrawerHeader>
        {tenant ? (
          <RentHistory tenantId={tenant._id} selectedTerm={selectedTerm} />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
