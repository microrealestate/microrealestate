import type { ReactNode } from 'react';

interface PublicLayoutProps {
  subtitle?: string;
  illustration?: ReactNode;
  children: ReactNode;
}

export default function PublicLayout({
  subtitle,
  illustration,
  children
}: PublicLayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-background">
      <div className="hidden md:flex flex-col items-center justify-center space-y-20 text-center font-medium bg-sky-900 text-white/95 w-xl">
        <div className="space-y-2">
          <div className="text-4xl">MicroRealEstate</div>
          {subtitle && <div>{subtitle}</div>}
        </div>
        {illustration}
      </div>
      <div className="relative size-full">
        <div className="md:hidden text-4xl text-center absolute top-30 w-full">
          MicroRealEstate
        </div>
        <div className="flex flex-col justify-center size-full">{children}</div>
      </div>
    </div>
  );
}
