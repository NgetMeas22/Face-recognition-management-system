"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type QueryState<T> = {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  reload: () => void;
};

type Settled<T> = { key: string | null; data?: T; error?: unknown };

/**
 * Minimal data loader for client components: aborts on unmount, ignores stale responses, and
 * exposes reload(). `key` identifies the request (change it to refetch); `enabled: false` skips
 * the request, e.g. when the user lacks the permission the endpoint requires.
 */
export function useApiQuery<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  { enabled = true }: { enabled?: boolean } = {},
): QueryState<T> {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({ key: null });
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const requestKey = enabled ? `${key}#${version}` : null;

  useEffect(() => {
    if (requestKey === null) return;
    const controller = new AbortController();
    fetcherRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ key: requestKey, data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setSettled((prev) => ({ key: requestKey, data: prev.data, error }));
      },
    );
    return () => controller.abort();
  }, [requestKey]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const current = settled.key === requestKey;
  return {
    // Keep showing the previous data while a reload is in flight.
    data: settled.data,
    error: current ? settled.error : undefined,
    isLoading: requestKey !== null && !current,
    reload,
  };
}
