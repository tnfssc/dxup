import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, ScrollRestoration, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { cn } from '~/utils';

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <div className={cn('w-screen h-screen overflow-auto scroll-smooth')}>
      <ScrollRestoration />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </div>
  );
}
