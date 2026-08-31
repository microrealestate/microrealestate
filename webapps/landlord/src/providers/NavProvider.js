'use client';

import Loading from '@microrealestate/commonui/components/ui/Loading';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition
} from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import useScroll from '../hooks/useScroll';

const scrollPositions = new Map();

const NavContext = createContext(null);

export function useNav() {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
}

export default function NavProvider({ children }) {
  const [previousPath, setPreviousPath] = useState(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const loading = redirecting || isPending;
  const { scrollY } = useScroll();
  const store = useStore();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentUrl =
    pathname + (searchParams?.toString() ? `?${searchParams}` : '');
  const prevUrlRef = useRef(null);
  const isRestoring = useRef(false);

  const goBack = () => {
    if (previousPath) {
      router.push(previousPath);
    } else {
      router.push('/');
    }
  };

  const navigateTo = useCallback(
    (url) => {
      startTransition(() => {
        router.push(url);
      });
    },
    [router]
  );

  const redirectTo = useCallback((url) => {
    setRedirecting(true);
    window.location.assign(url);
  }, []);

  useEffect(() => {
    try {
      if (document.referrer) {
        const referrerUrl = new URL(document.referrer);
        if (referrerUrl.origin === window.location.origin) {
          let referrerPath = referrerUrl.pathname + referrerUrl.search;

          // Strip basePath and locale prefix from the referrer
          // window.location.pathname is e.g. /landlord/fr-FR/ACME/properties
          // pathname (from next-intl usePathname) is e.g. /ACME/properties (no basePath, no locale)
          const browserPathname = window.location.pathname;
          if (browserPathname.endsWith(pathname)) {
            const prefix = browserPathname.substring(
              0,
              browserPathname.length - pathname.length
            );
            if (prefix && referrerPath.startsWith(prefix)) {
              referrerPath = referrerPath.substring(prefix.length);
            }
          }
          setPreviousPath(referrerPath);
          setCanGoBack(true);
        }
      }
    } catch (_e) {}
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      // Don't save while we are actively restoring or if scroll is 0 (as it might be a reset)
      if (!isRestoring.current && window.scrollY > 0) {
        scrollPositions.set(currentUrl, window.scrollY);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentUrl]);

  useEffect(() => {
    if (prevUrlRef.current !== null && prevUrlRef.current !== currentUrl) {
      setPreviousPath(prevUrlRef.current);
      setCanGoBack(true);

      const publicAuthPagesRegex =
        /\/(signin|signup|forgotpassword|resetpassword)$|\/resetpassword(?:\/.*)?$/;
      const isPublicAuthPage = publicAuthPagesRegex.test(pathname);

      if (isPublicAuthPage && store?.user?.signedIn && store?.reset) {
        scrollPositions.clear();
        window.sessionStorage.clear();
        queryClient.clear();
        store.reset();
        setPreviousPath(null);
        setCanGoBack(false);
      } else {
        const saved = scrollPositions.get(currentUrl);
        if (saved) {
          isRestoring.current = true;
          scrollY(saved);
          // Allow some time for the content to settle before enabling scroll saving again
          setTimeout(() => {
            isRestoring.current = false;
          }, 1000);
        }
      }
    }
    prevUrlRef.current = currentUrl;
  }, [currentUrl, pathname, queryClient, scrollY, store]);

  return (
    <NavContext.Provider
      value={{ previousPath, canGoBack, goBack, navigateTo, redirectTo }}
    >
      {loading && <Loading fullScreen />}
      {children}
    </NavContext.Provider>
  );
}
