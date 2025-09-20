import { useEffect, useMemo } from 'react';
import { debounce } from 'lodash-es';

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const debouncedFn = useMemo(() => debounce(callback, delay), [callback, delay]);

  useEffect(() => {
    return () => {
      debouncedFn.cancel();
    };
  }, [debouncedFn]);

  return debouncedFn;
};
