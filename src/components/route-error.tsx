import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { type ErrorRouteComponent, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

import { Button } from '~/ui/button';

export const RouteError: ErrorRouteComponent = ({ error }) => {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div>
      {error.message}
      <Button
        onClick={() => {
          void router.invalidate();
        }}
      >
        Reload
      </Button>
    </div>
  );
};
