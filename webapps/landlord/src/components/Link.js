import { Button } from './ui/button';
import { cn } from '../utils';
import { forwardRef } from 'react';
import NextLink from 'next/link';

export default forwardRef(function Link({ className, ...props }, ref) {
  return (
    <Button
      variant="link"
      className={cn('inline-block h-fit p-0 m-0', className)}
      asChild
    >
      <NextLink {...props} ref={ref} />
    </Button>
  );
});
