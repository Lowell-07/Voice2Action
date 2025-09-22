import { useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash-es';

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });
  
  const debouncedFn = useMemo(() => debounce((...args) => callbackRef.current(...args), delay), [delay]);

  useEffect(() => {
    return () => {
      debouncedFn.cancel();
    };
  }, [debouncedFn]);

  return debouncedFn;
};
