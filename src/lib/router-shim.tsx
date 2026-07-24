"use client";
import React from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams, useSearchParams as useNextSearchParams } from 'next/navigation';

const ROUTER_STATE_KEY = 'gwd_router_state';

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const MemoryRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const Link = React.forwardRef(({ to, children, ...props }: any, ref) => {
  return <NextLink ref={ref} href={to} {...props}>{children}</NextLink>;
});
Link.displayName = 'Link';

export const useNavigate = () => {
  const router = useRouter();
  return (path: string | number, options?: { replace?: boolean; state?: any }) => {
    if (typeof path === 'number') {
      if (path === -1) {
        router.back();
      } else if (path === 1) {
        router.forward();
      } else {
        router.back(); 
      }
      return;
    }
    if (options?.state && typeof window !== 'undefined') {
      sessionStorage.setItem(ROUTER_STATE_KEY, JSON.stringify(options.state));
    }
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
};

export const useLocation = () => {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  const [state, setState] = React.useState<any>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(ROUTER_STATE_KEY);
    if (!stored) return;
    try {
      setState(JSON.parse(stored));
    } finally {
      sessionStorage.removeItem(ROUTER_STATE_KEY);
    }
  }, [pathname]);

  return {
    pathname: pathname || '/',
    search: searchParams && searchParams.toString() ? `?${searchParams.toString()}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state,
    key: 'default'
  };
};

export const useParams = <T extends Record<string, string | string[]> = Record<string, string>>() => {
  const params = useNextParams();
  return (params || {}) as T;
};

export const useSearchParams = () => {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const setSearchParams = (newParams: URLSearchParams | Record<string, string>, navigateOptions?: { replace?: boolean; state?: any }) => {
    const params = new URLSearchParams(newParams as any);
    if (navigateOptions?.replace) {
      router.replace(`${pathname}?${params.toString()}`);
    } else {
      router.push(`${pathname}?${params.toString()}`);
    }
  };
  
  return [searchParams || new URLSearchParams(), setSearchParams] as const;
};

export const Navigate = ({ to, replace, state }: { to: string; replace?: boolean; state?: any }) => {
  const router = useRouter();
  React.useEffect(() => {
    if (state && typeof window !== 'undefined') {
      sessionStorage.setItem(ROUTER_STATE_KEY, JSON.stringify(state));
    }
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router, state]);
  return null;
};
