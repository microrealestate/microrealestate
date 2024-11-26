import { Avatar, AvatarFallback } from '../ui/avatar';
import PropertyIcon from './PropertyIcon';

export default function PropertyAvatar({ property }) {
  return (
    <Avatar className="size-14">
      <AvatarFallback className="bg-primary/20 font-medium">
        <PropertyIcon type={property.type} />
      </AvatarFallback>
    </Avatar>
  );
}
