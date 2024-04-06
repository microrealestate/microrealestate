import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { ArrowRightCircleIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../utils';

export function DashboardCard({
  Icon,
  title,
  description,
  renderContent,
  onClick,
  className
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2 pr-4">
        <CardTitle className="flex items-center justify-between font-normal text-xs xl:text-base">
          {title}
          {Icon ? <Icon size="20" className="text-muted-foreground" /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          'flex justify-between items-center text-3xl xl:text-4xl font-medium pr-4'
        )}
      >
        <div className="w-full h-full">
          {renderContent?.()}
          <CardDescription className="text-xs mt-2">
            {description}
          </CardDescription>
        </div>
        {onClick ? (
          <Button variant="secondary" onClick={onClick} className="h-full p-1">
            <ArrowRightCircleIcon size="32" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
