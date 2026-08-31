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
}

export function DashboardCard({
  Icon,
  title,
  description,
  renderContent,
  onClick,
  className,
  loading = false,
  loadingContent
}: DashboardCardProps) {
  return (
    <Card className={cn('flex flex-col justify-center size-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-normal text-xs md:text-sm xl:text-base">
          {title}
          {Icon ? <Icon className="size-6 text-muted-foreground" /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="grow flex justify-between items-center text-2xl md:text-3xl xl:text-4xl font-medium">
        <div className="w-full h-full">
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
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardFooter>
    </Card>
  );
}
