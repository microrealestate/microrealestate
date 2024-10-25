import getServerEnv from '@/utils/env/server';
import Image from 'next/image';

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
      <Illustration
        src={`${getServerEnv('BASE_PATH')}/welcome.svg`}
        alt="welcome"
      />
    </div>
  );
};
