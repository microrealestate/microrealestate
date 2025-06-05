import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    <Card className={cn('flex flex-col justify-center', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-normal text-xs xl:text-base">
          {title}
          {Icon ? <Icon className="size-6 text-muted-foreground" /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex justify-between items-center text-3xl xl:text-4xl font-medium space-x-2">
        <div className="w-full h-full">{renderContent?.()}</div>
        {onClick ? (
          <Button variant="link" className="p-0 m-0 h-fit" onClick={onClick}>
            <LuArrowRightCircle className="size-8" />
          </Button>
        ) : null}
      </CardContent>
      {description ? (
        <CardFooter>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardFooter>
      ) : null}
    </Card>
  );
}
