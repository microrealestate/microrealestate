import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Button } from '../ui/button';
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
      <CardHeader className="pr-4">
        <CardTitle className="flex items-center justify-between font-normal text-xs xl:text-base">
          {title}
          {Icon ? <Icon className="size-6 text-muted-foreground" /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between items-center text-3xl xl:text-4xl font-medium pr-4">
        <div className="w-full h-full">{renderContent?.()}</div>
        {onClick ? (
          <Button variant="ghost" size="icon" onClick={onClick}>
            <LuArrowRightCircle className="size-8" />
          </Button>
        ) : null}
      </CardContent>
      <CardFooter>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardFooter>
    </Card>
  );
}
