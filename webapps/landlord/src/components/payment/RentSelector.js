import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { Separator } from '@microrealestate/commonui/components/ui/separator';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import RentAmount from '../rents/RentAmount';
import { getRentAmounts } from '../rents/RentDetails';

function SelectRentItem({ rent, onClick }) {
  const t = useTranslations('common');
  const rentAmounts = rent ? getRentAmounts(rent) : null;

  return (
    <div className="w-full">
      {rent?.occupant ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 items-center text-left"
          onClick={onClick}
        >
          <div>{rent.occupant.name}</div>
          <div className="flex md:grid md:grid-cols-2 items-center">
            <RentAmount
              label={t('Total to pay')}
              amount={rentAmounts.totalAmount}
              withColor={false}
              debitColor={rentAmounts.totalAmount > 0}
            />
            <div className="grow">
              <RentAmount
                label={t('Payment')}
                amount={rentAmounts.payment !== 0 ? rentAmounts.payment : null}
                withColor={true}
              />
            </div>
          </div>
        </div>
      ) : (
        t('Select a rent')
      )}
    </div>
  );
}

export default function RentSelector({ value, rents, onChange, className }) {
  const [open, setOpen] = useState(false);

  const handleChange = (rent) => {
    onChange(rent);
    setOpen(false);
  };

  if (!rents?.length) {
    return null;
  }

  return rents?.length > 1 ? (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('flex w-full h-fit gap-2 bg-card px-4', className)}
        >
          <SelectRentItem rent={value} />
          <LuChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className="flex flex-col h-72 overflow-y-auto popover-content-width-same-as-its-trigger p-0"
      >
        {rents
          ?.sort(({ occupant: { name: n1 } }, { occupant: { name: n2 } }) =>
            n1.localeCompare(n2)
          )
          .map((rent) => {
            return (
              <div key={rent._id}>
                <div className="cursor-pointer py-2 pl-4 pr-12 hover:bg-primary/10">
                  <SelectRentItem
                    rent={rent}
                    onClick={() => handleChange(rent)}
                  />
                </div>
                <Separator />
              </div>
            );
          })}
      </PopoverContent>
    </Popover>
  ) : (
    <Button variant="outline" className={cn('w-full h-fit bg-card', className)}>
      <SelectRentItem rent={value} />
    </Button>
  );
}
