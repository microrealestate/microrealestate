import { forwardRef, useContext } from 'react';
import { Avatar } from './ui/avatar';
import { cn } from '../utils';
import { StoreContext } from '../store';

function UserAvatar({ className, ...props }, ref) {
  const store = useContext(StoreContext);
  return (
    <Avatar ref={ref} className="hover:ring-2 ring-ring" {...props}>
      <span
        className={cn(
          'flex h-full w-full items-center justify-center rounded-full font-medium bg-secondary text-muted-foreground text-lg',
          className
        )}
      >
        {`${store.user.firstName.charAt(0).toUpperCase()}${store.user.lastName
          .charAt(0)
          .toUpperCase()}`}
      </span>
    </Avatar>
  );
}

export default forwardRef(UserAvatar);
