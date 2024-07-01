import { cn } from '../utils';
import { HeartHandshakeIcon } from 'lucide-react';
import SideMenuButton from './SideMenuButton';

function HeartBeating() {
  return <HeartHandshakeIcon className="text-destructive" />;
}

export default function SponsorMenu({ className }) {
  const handleSponsorClicked = () => {
    window.open(
      'https://github.com/sponsors/camelaissani',
      '_blank',
      'noreferrer'
    );
  };

  return (
    <SideMenuButton
      item={{
        Icon: HeartBeating,
        labelId: 'Sponsor this project'
      }}
      onClick={handleSponsorClicked}
      className={cn(className, 'animate-pulse')}
    />
  );
}
