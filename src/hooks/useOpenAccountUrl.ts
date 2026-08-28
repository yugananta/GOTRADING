import { useState, useEffect, useCallback } from 'react';

export const DEFAULT_OPEN_ACCOUNT_URL = 'https://www.axi.com';

export interface PublicSettingsResponse {
  openAccountUrl?: string;
  [key: string]: any;
}

// Module-level cache so multiple components and re-renders share the same fetched URL
let cachedOpenAccountUrl: string | null = null;
let activeFetchPromise: Promise<string> | null = null;

/**
 * Fetches the dynamic open account URL from the public settings endpoint.
 * Falls back to DEFAULT_OPEN_ACCOUNT_URL on any network/format error.
 */
export async function fetchPublicOpenAccountUrl(): Promise<string> {
  if (cachedOpenAccountUrl) {
    return cachedOpenAccountUrl;
  }

  if (activeFetchPromise) {
    return activeFetchPromise;
  }

  activeFetchPromise = (async () => {
    try {
      // GET /api/settings/public is a public endpoint (no auth headers required)
      const response = await fetch('/api/settings/public', {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: PublicSettingsResponse = await response.json();
      if (data && typeof data.openAccountUrl === 'string' && data.openAccountUrl.trim().length > 0) {
        cachedOpenAccountUrl = data.openAccountUrl.trim();
        return cachedOpenAccountUrl;
      }
      return DEFAULT_OPEN_ACCOUNT_URL;
    } catch (err) {
      // Silent error handling: log warning without raising user-facing errors
      console.warn('[useOpenAccountUrl] Failed to fetch /api/settings/public, using fallback default URL:', err);
      return DEFAULT_OPEN_ACCOUNT_URL;
    } finally {
      activeFetchPromise = null;
    }
  })();

  return activeFetchPromise;
}

/**
 * React hook to access the dynamic broker "Open Account" URL with loading & error states.
 */
export function useOpenAccountUrl() {
  const [openAccountUrl, setOpenAccountUrl] = useState<string>(
    cachedOpenAccountUrl || DEFAULT_OPEN_ACCOUNT_URL
  );
  const [isLoading, setIsLoading] = useState<boolean>(!cachedOpenAccountUrl);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (cachedOpenAccountUrl) {
      setOpenAccountUrl(cachedOpenAccountUrl);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchPublicOpenAccountUrl()
      .then((url) => {
        if (isMounted) {
          setOpenAccountUrl(url || DEFAULT_OPEN_ACCOUNT_URL);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[useOpenAccountUrl] Unexpected error in hook:', err);
          setOpenAccountUrl(DEFAULT_OPEN_ACCOUNT_URL);
          setIsLoading(false);
          setIsError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openAccount = useCallback(() => {
    const targetUrl = openAccountUrl || DEFAULT_OPEN_ACCOUNT_URL;
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  }, [openAccountUrl]);

  return {
    openAccountUrl: openAccountUrl || DEFAULT_OPEN_ACCOUNT_URL,
    isLoading,
    isError,
    openAccount,
  };
}
