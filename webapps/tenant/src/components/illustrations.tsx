import Image from 'next/image';
import { BASE_PATH } from '@/utils/basepath';

function Illustration({
  src,
  label,
  alt
}: {
  src: string;
  label?: string;
  alt: string;
}) {
  return (
    <div className="flex flex-col gap-4 items-center w-full h-full">
      <div className="relative w-full h-full">
        <Image src={src} alt={alt} fill />
      </div>
      {!!label && <p className="text-xl text-muted-foreground">{label}</p>}
    </div>
  );
}

export const WelcomeIllustration = () => {
  return (
    <div className="h-64 w-full">
      <Illustration src={`${BASE_PATH}/welcome.svg`} alt="welcome" />
    </div>
  );
};
