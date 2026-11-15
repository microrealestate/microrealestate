'use client';

import {
  Avatar,
  AvatarFallback
} from '@microrealestate/commonui/components/ui/avatar';
import { cn } from '@microrealestate/commonui/utils';
import { LuUser } from 'react-icons/lu';

interface UserAvatarProps {
  user: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
  };
  size?: 'sm' | 'lg';
  className?: string;
}

function initialsOf({
  firstName,
  lastName,
  name,
  email
}: UserAvatarProps['user']) {
  const first = firstName?.trim()[0] ?? '';
  const last = lastName?.trim()[0] ?? '';
  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }
  return (email?.trim()[0] ?? '').toUpperCase();
}

export function UserAvatar({ user, size = 'sm', className }: UserAvatarProps) {
  const initials = initialsOf(user);

  return (
    <Avatar
      aria-hidden="true"
      className={cn(size === 'lg' ? 'size-10' : 'size-8', className)}
    >
      <AvatarFallback
        className={cn(
          'bg-primary/15 text-primary font-medium',
          size === 'lg' ? 'text-sm' : 'text-xs'
        )}
      >
        {initials || <LuUser className={size === 'lg' ? 'size-5' : 'size-4'} />}
      </AvatarFallback>
    </Avatar>
  );
}
