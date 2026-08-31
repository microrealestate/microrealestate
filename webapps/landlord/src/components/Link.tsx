import { Button } from '@microrealestate/commonui/components/ui/button';
import { cn } from '@microrealestate/commonui/utils';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { Link as NextIntlLink } from '@/i18n/navigation';

const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextIntlLink>>(
  function Link({ className, ...props }, ref) {
    return (
      <Button
        variant="link"
        className={cn('inline-block h-fit p-0 m-0', className)}
        asChild
      >
        <NextIntlLink {...props} ref={ref} />
      </Button>
    );
  }
);

export default Link;
