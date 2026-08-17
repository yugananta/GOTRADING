import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from './apiFetch';

/**
 * Enhanced reusable polling utility that fetches data at a specified interval with exponential backoff on errors.
 * 
 * @param url The URL to fetch data from
 * @param onData Callback for successful data retrieval
 * @param onError Callback for error handling
 * @param interval Polling interval in milliseconds (default 30000)
 * @param requestInit Optional fetch configuration (headers, method, etc.)
 * @returns A stop function with helper properties (.refetch, .stop, .isPolling)
 */
export function poll<T>(
  url: string,
  onData: (data: T) => void,
  onError?: (error: any) => void,
  interval: number = 30000,
  requestInit: RequestInit = {}
) {
  let timerId: any = null;
  let isStopped = false;
  let currentInterval = interval;

  const fetchData = async () => {
    if (isStopped) return;
    
    try {
      const response = await apiFetch(url, {
        ...requestInit,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...(requestInit.headers as Record<string, string> | undefined),
        }
      });

      if (response.status === 429) {
        console.warn(`Rate limited (429) on ${url}, backing off...`);
        currentInterval = Math.min(currentInterval * 1.5, 120000); // Max backoff 2 minutes
        if (!isStopped) {
          timerId = setTimeout(() => { fetchData().catch(() => {}); }, currentInterval);
        }
        return;
      }
      
      if (!response.ok) {
        if (onError) {
          try { onError(new Error(`HTTP error! status: ${response.status}`)); } catch {}
        }
      } else {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          currentInterval = interval; // Reset backoff on success
          onData(data);
        } catch (e) {
          if (onError) {
            try { onError(new Error('Response is not valid JSON')); } catch {}
          }
        }
      }
    } catch (error) {
      if (onError) {
        try { onError(error); } catch {}
      } else {
        console.warn(`Polling notice for ${url}:`, error);
      }
    }

    if (!isStopped) {
      timerId = setTimeout(() => { fetchData().catch(() => {}); }, currentInterval);
    }
  };

  // Initial fetch
  fetchData().catch(() => {});

  const stop = () => {
    isStopped = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const refetch = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    return fetchData();
  };

  // Attach methods to the returned function to maintain backwards compatibility with `const stop = poll(...)`
  const stopFn = Object.assign(stop, {
    stop,
    refetch,
    isPolling: () => !isStopped
  });

  return stopFn;
}

/**
 * React hook wrapper around the polling utility with countdown timer & sync metrics.
 */
export function usePolling<T>(
  url: string,
  intervalSeconds: number = 30,
  options: { enabled?: boolean; requestInit?: RequestInit } = {}
) {
  const { enabled = true, requestInit } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [nextSyncSeconds, setNextSyncSeconds] = useState<number>(intervalSeconds);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const pollerRef = useRef<any>(null);

  const refetch = useCallback(() => {
    if (pollerRef.current?.refetch) {
      pollerRef.current.refetch();
      setNextSyncSeconds(intervalSeconds);
    }
  }, [intervalSeconds]);

  useEffect(() => {
    if (!enabled) return;

    setIsLoading(true);
    setNextSyncSeconds(intervalSeconds);

    const poller = poll<T>(
      url,
      (fetchedData) => {
        setData(fetchedData);
        setIsLoading(false);
        setError(null);
        setIsConnected(true);
        setLastSyncTime(new Date());
        setNextSyncSeconds(intervalSeconds);
      },
      (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
        setIsConnected(false);
        setNextSyncSeconds(intervalSeconds);
      },
      intervalSeconds * 1000,
      requestInit
    );

    pollerRef.current = poller;

    // Countdown interval timer
    const countdownInterval = setInterval(() => {
      setNextSyncSeconds(prev => (prev <= 1 ? intervalSeconds : prev - 1));
    }, 1000);

    return () => {
      poller();
      clearInterval(countdownInterval);
    };
  }, [url, intervalSeconds, enabled]);

  return {
    data,
    isLoading,
    error,
    isConnected,
    nextSyncSeconds,
    lastSyncTime,
    refetch
  };
}
