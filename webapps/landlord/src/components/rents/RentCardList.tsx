import { Card } from '@microrealestate/commonui/components/ui/card';
import { cn } from '@microrealestate/commonui/utils';
import { LuChevronRight } from 'react-icons/lu';
import { useMultiSelectionContext } from '../MultiSelection';
import {
  LeftToPay,
  RentEmailSummary,
  RentProgress,
  RentStatusBadge,
  useRentPropertySummary
} from './RentCells';
import { RentCheckbox, TenantName } from './RentTableParts';
import { rentKey } from './rentView';
import type { RentTableViewProps } from './types';

export default function RentCardList({
  rents,
  canSelect,
  onDetails
}: RentTableViewProps) {
  const propertySummary = useRentPropertySummary();
  const { selected } = useMultiSelectionContext();

  return (
    <div className="space-y-2">
      {rents.map((rent) => {
        const key = rentKey(rent);
        const isSelected = selected.has(key);
        return (
          <Card
            key={key}
            className={cn(
              'flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted',
              isSelected && 'border-primary bg-primary/5'
            )}
            onClick={() => onDetails(rent)}
          >
            {canSelect ? (
              // biome-ignore lint/a11y/noStaticElementInteractions: only stops the card click; the checkbox inside is the control
              // biome-ignore lint/a11y/useKeyWithClickEvents: same as above
              <div
                className="pt-0.5"
                onClick={(event) => event.stopPropagation()}
              >
                <RentCheckbox rent={rent} />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <TenantName
                  rent={rent}
                  onOpen={onDetails}
                  className="max-w-full line-clamp-2 wrap-break-word"
                />
                <div className="truncate text-sm text-muted-foreground">
                  {propertySummary(rent)}
                </div>
                <RentEmailSummary rent={rent} />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <LeftToPay rent={rent} className="text-base" />
                <RentStatusBadge rent={rent} />
              </div>
              <RentProgress rent={rent} className="h-1" />
            </div>
            <LuChevronRight
              className="size-5 shrink-0 self-center text-muted-foreground"
              aria-hidden="true"
            />
          </Card>
        );
      })}
    </div>
  );
}
