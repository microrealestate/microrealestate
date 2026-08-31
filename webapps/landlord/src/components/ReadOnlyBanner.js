import { LuLock, LuLockOpen } from 'react-icons/lu';

export default function ReadOnlyBanner({ readOnly, className }) {
  return (
    <div className={className}>
      {readOnly ? (
        <LuLock className="size-4" />
      ) : (
        <LuLockOpen className="size-4" />
      )}
    </div>
  );
}
