import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../utils';
import { LuArrowRightCircle } from 'react-icons/lu';

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
          <Button variant="ghost" size="icon" onClick={onClick}>
            <LuArrowRightCircle className="size-8" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
