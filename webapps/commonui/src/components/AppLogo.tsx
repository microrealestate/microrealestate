import { BRAND_ACCENT_COLOR, BRAND_COLOR } from '../styles/brand';
import { cn } from '../utils';

const BLUE = BRAND_COLOR;
const LIT_WINDOW = BRAND_ACCENT_COLOR;

// Blinks at ~1 s and ~6.5 s on a 10 s loop, so the gaps feel natural (5.5 s, 4.5 s).
// Switched off when the system asks to reduce motion.
const ANIMATION_CSS = `
.mre-eye{transform-box:fill-box;transform-origin:center;animation:mre-blink 10s ease-in-out infinite}
@keyframes mre-blink{0%,9%,10.8%,64%,65.8%,100%{transform:scaleY(1)}9.9%,64.9%{transform:scaleY(.1)}}
@media (prefers-reduced-motion:reduce){.mre-eye{animation:none}}
`;

interface AppLogoProps {
  size?: number;
  withName?: boolean;
  orientation?: 'horizontal' | 'vertical';
  animated?: boolean;
  className?: string;
}

export default function AppLogo({
  size = 48,
  withName = false,
  orientation = 'horizontal',
  animated = false,
  className
}: AppLogoProps) {
  const vertical = orientation === 'vertical';
  const eyeClass = animated ? 'mre-eye' : undefined;

  const mark = (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('shrink-0', withName ? undefined : className)}
      aria-hidden={withName ? true : undefined}
    >
      <title>MicroRealEstate</title>
      {animated ? <style>{ANIMATION_CSS}</style> : null}
      <rect width="64" height="64" rx="14" fill={BLUE} />
      <path
        d="M13 51 L13 27.5 L21 16 L32 29 L43 16 L51 27.5 L51 51 Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth={9}
        strokeLinejoin="round"
      />
      <rect
        className={eyeClass}
        x="17"
        y="28"
        width="8"
        height="11"
        rx="4"
        fill={LIT_WINDOW}
      />
      <rect
        className={eyeClass}
        x="39"
        y="28"
        width="8"
        height="11"
        rx="4"
        fill={BLUE}
      />
      <path
        d="M21 43 Q32 51.5 43 43"
        fill="none"
        stroke={BLUE}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </svg>
  );

  if (!withName) {
    return mark;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center',
        vertical ? 'flex-col' : 'flex-row',
        className
      )}
      style={{ gap: Math.round(size * (vertical ? 0.21 : 0.25)) }}
    >
      {mark}
      <span
        className="font-bold tracking-tight leading-none text-foreground"
        style={{ fontSize: Math.round(size * (vertical ? 0.29 : 0.47)) }}
      >
        MicroRealEstate
      </span>
    </div>
  );
}
