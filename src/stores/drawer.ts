import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';
import { useCallback, useMemo } from 'react';

export const $drawerOpen = atom(false);

export const useDrawerOpen = () => {
  const open = useStore($drawerOpen);

  const toggle = useCallback((v?: boolean) => {
    if (v !== undefined) $drawerOpen.set(v);
    else $drawerOpen.set(!$drawerOpen.value);
  }, []);

  const result = useMemo(() => ({ open, toggle }), [open, toggle]);

  return result;
};
