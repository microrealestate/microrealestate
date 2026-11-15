'use client';

import Loading from '@microrealestate/commonui/components/ui/Loading';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  createContext,
  type PropsWithChildren,
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

const scrollPositions = new Map<string, number>();

type NavContextValue = {
  goBack: (fallback?: string) => void;
  navigateTo: (url: string) => void;
  redirectTo: (url: string) => void;
};

const NavContext = createContext<NavContextValue | null>(null);

export function useNav(): NavContextValue {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
}

export default function NavProvider({ children }: PropsWithChildren) {
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
  const prevUrlRef = useRef<string | null>(null);
  const isRestoring = useRef(false);
  const historyStack = useRef<string[]>([]);

  const goBack = useCallback(
    (fallback = '/') => {
      if (historyStack.current.length > 1) {
        router.back();
      } else {
        router.push(fallback);
      }
    },
    [router]
  );

  const navigateTo = useCallback(
    (url: string) => {
      startTransition(() => {
        router.push(url);
      });
    },
    [router]
  );

  const redirectTo = useCallback((url: string) => {
    setRedirecting(true);
    window.location.assign(url);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!isRestoring.current && window.scrollY > 0) {
        scrollPositions.set(currentUrl, window.scrollY);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentUrl]);

  useEffect(() => {
    if (prevUrlRef.current === currentUrl) {
      return;
    }

    const stack = historyStack.current;
    if (stack.length > 1 && stack[stack.length - 2] === currentUrl) {
      stack.pop();
    } else {
      stack.push(currentUrl);
    }

    if (prevUrlRef.current !== null) {
      const publicAuthPagesRegex =
        /\/(signin|signup|forgotpassword|resetpassword)$|\/resetpassword(?:\/.*)?$/;
      const isPublicAuthPage = publicAuthPagesRegex.test(pathname);

      if (isPublicAuthPage && store?.user?.signedIn && store?.reset) {
        scrollPositions.clear();
        historyStack.current = [currentUrl];
        window.sessionStorage.clear();
        queryClient.clear();
        store.reset();
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
    <NavContext.Provider value={{ goBack, navigateTo, redirectTo }}>
      {loading && <Loading fullScreen />}
      {children}
    </NavContext.Provider>
  );
}
