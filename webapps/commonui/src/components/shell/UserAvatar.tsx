'use client';

interface UserAvatarProps {
  user: { firstName?: string; lastName?: string; email?: string };
}

export function UserAvatar({ user }: UserAvatarProps) {
  let name = '';
  if (user.firstName && user.lastName) {
    name = `${user.firstName[0]}${user.lastName[0]}`;
  } else if (user.email) {
    name = user.email[0];
  }
  const initials = name.toUpperCase().slice(0, 2);

  return initials ? (
    <div className="flex items-center justify-center rounded-full font-bold text-muted-foreground p-1 border-2 hover:border-ring/50 min-w-8">
      {initials}
    </div>
  ) : null;
}
