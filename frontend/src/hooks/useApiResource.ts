import { useCallback, useEffect, useRef, useState } from "react";

export interface ResourceState<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
}

export interface Resource<T> extends ResourceState<T> {
  /** Re-run the fetcher (e.g. from a retry button). */
  reload: () => void;
}

/**
 * Runs an async fetcher and tracks {data, error, loading}, with:
 *   - AbortController wired to the effect lifecycle (cancels in-flight
 *     requests on unmount or dependency change; AbortErrors are swallowed).
 *   - A stable `reload()` that forces a refetch.
 *
 * The fetcher is read through a ref so inline arrow fetchers don't cause
 * refetch loops — pass the *real* inputs via `deps` instead.
 */
export function useApiResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList = [],
): Resource<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ data: prev.data, error: null, loading: true }));

    fetcherRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ data, error: null, loading: false });
        }
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ data: null, error, loading: false });
      },
    );

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, reload };
}
