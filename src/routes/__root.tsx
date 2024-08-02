import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, ScrollRestoration, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { css } from 'styled-system/css';

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <div
      className={css({
        w: 'screen',
        h: 'screen',
        overflow: 'auto',
        scrollBehavior: 'smooth',
        scrollbar: 'hidden',
      })}
    >
      <ScrollRestoration />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </div>
  );
}
