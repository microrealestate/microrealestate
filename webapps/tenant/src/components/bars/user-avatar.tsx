'use client';

import { Avatar } from '@/components/ui/avatar';
import useSession from '@/utils/session/client/usesession';

export default function UserAvatar() {
  const { session, status } = useSession();

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <Avatar className="hover:ring-2 ring-ring">
      <span className="flex h-full w-full items-center justify-center rounded-full font-medium bg-secondary text-muted-foreground text-2xl">
        {session?.email?.charAt(0).toUpperCase()}
      </span>
    </Avatar>
  );
}
