import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { cn } from '@microrealestate/commonui/utils';
import _ from 'lodash';
import PropertyIcon from '../properties/PropertyIcon';

function Address({ address }) {
  if (!address?.street1) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground">
      {address.street1}
      <br />
      {address.street2 ? (
        <>
          {address.street2}
          <br />
        </>
      ) : null}
      {address.city} {address.zipCode}
      <br />
      {address.state && address.country
        ? `${address.state} ${address.country}`
        : address.country}
    </p>
  );
}

export default function TenantPropertyList({ tenant, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-4 p-4 border rounded bg-body',
        className
      )}
    >
      {_.uniqBy(tenant.properties ?? [], ({ property }) => property._id).map(
        ({ property }) => (
          <Popover key={property._id}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <PropertyIcon type={property.type} className="size-8" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-4 w-fit">
              <div>
                <p className="text-sm font-medium leading-none">
                  {property.name}
                </p>
                {!!property.description && (
                  <p className="text-xs text-muted-foreground">
                    {property.description}
                  </p>
                )}

                <Address address={property.address} />
              </div>
            </PopoverContent>
          </Popover>
        )
      )}
    </div>
  );
}
