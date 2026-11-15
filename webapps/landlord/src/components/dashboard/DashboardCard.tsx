import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { Skeleton } from '@microrealestate/commonui/components/ui/skeleton';
import { cn } from '@microrealestate/commonui/utils';
import type { ElementType, ReactNode } from 'react';
import { LuCircleArrowRight } from 'react-icons/lu';

interface DashboardCardProps {
  Icon?: ElementType;
  title?: ReactNode;
  description?: ReactNode;
  renderContent?: () => ReactNode;
  onClick?: () => void;
  loading?: boolean;
  loadingContent?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DashboardCard({
  Icon,
  title,
  description,
  renderContent,
  onClick,
  className,
  contentClassName,
  loading = false,
  loadingContent
}: DashboardCardProps) {
  return (
    <Card className={cn('@container/card flex flex-col size-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 font-normal text-sm">
          <span className="min-w-0 wrap-break-word hyphens-auto">{title}</span>
          {Icon ? (
            <Icon className="hidden size-6 shrink-0 text-muted-foreground @min-[11rem]/card:block" />
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          'grow flex justify-between items-start text-2xl @min-[70rem]/dashboard:text-3xl tabular-nums font-medium',
          contentClassName
        )}
      >
        <div className="w-full h-full min-w-0">
          {loading
            ? loadingContent || <Skeleton className="h-8 w-16 rounded" />
            : renderContent?.()}
        </div>
        {onClick ? (
          <Button
            variant="ghost"
            className=" rounded-full shadow-none border-none p-0 m-0 size-8"
            onClick={onClick}
          >
            <LuCircleArrowRight className="size-8 text-primary" />
          </Button>
        ) : null}
      </CardContent>
      <CardFooter>
        <CardDescription className="text-xs wrap-break-word hyphens-auto">
          {description}
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
