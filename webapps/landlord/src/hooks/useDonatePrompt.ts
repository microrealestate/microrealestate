import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

const STORAGE_KEY = 'mre-donate-prompt';

const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_DAYS = 14;
const SNOOZE_DAYS = 30;

const isDev = process.env.NODE_ENV !== 'production';

function readDonateParam(): string | null {
  if (!isDev || typeof window === 'undefined') {
    return null;
  }
  return new URLSearchParams(window.location.search).get('donate');
}

const SHOWS_BEFORE_DISMISS_FOREVER = 3;

type DonatePromptState = {
  firstSeenAt: number | null;
  snoozedUntil: number | null;
  shownCount: number;
  never: boolean;
};

const initialState: DonatePromptState = {
  firstSeenAt: null,
  snoozedUntil: null,
  shownCount: 0,
  never: false
};

export default function useDonatePrompt() {
  const [state, setState, removeState] = useLocalStorage<DonatePromptState>(
    STORAGE_KEY,
    initialState
  );

  const donateParam = readDonateParam();
  const forcedShowNumber =
    donateParam && /^\d+$/.test(donateParam) && Number(donateParam) >= 1
      ? Number(donateParam)
      : null;
  const [forceDismissed, setForceDismissed] = useState(false);
  const didReset = useRef(false);

  useEffect(() => {
    if (donateParam === 'reset' && !didReset.current) {
      didReset.current = true;
      removeState();
    }
  }, [donateParam, removeState]);

  useEffect(() => {
    if (state.firstSeenAt === null) {
      setState((previous) => ({ ...previous, firstSeenAt: Date.now() }));
    }
  }, [state.firstSeenAt, setState]);

  const snooze = useCallback(() => {
    setForceDismissed(true);
    setState((previous) => ({
      ...previous,
      snoozedUntil: Date.now() + SNOOZE_DAYS * DAY_MS,
      shownCount: (previous.shownCount ?? 0) + 1
    }));
  }, [setState]);

  const dismissForever = useCallback(() => {
    setForceDismissed(true);
    setState((previous) => ({ ...previous, never: true }));
  }, [setState]);

  const forced = forcedShowNumber !== null && !forceDismissed;

  const now = Date.now();
  const shouldShow =
    forced ||
    (!state.never &&
      state.firstSeenAt !== null &&
      now >= state.firstSeenAt + GRACE_DAYS * DAY_MS &&
      (state.snoozedUntil === null || now >= state.snoozedUntil));

  const shownCount =
    forcedShowNumber !== null ? forcedShowNumber - 1 : (state.shownCount ?? 0);
  const canDismissForever = shownCount >= SHOWS_BEFORE_DISMISS_FOREVER;

  return { shouldShow, canDismissForever, snooze, dismissForever };
}
