import { FaHeart } from 'react-icons/fa';
import SideMenuButton from './SideMenuButton';

function HeartBeating() {
  return (
    <FaHeart className="text-destructive size-4 mx-1 animate-pulse backg" />
  );
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
      className={className}
    />
  );
}
