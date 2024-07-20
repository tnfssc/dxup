import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { css } from 'styled-system/css';

import { Navbar, navbarHeightInPx } from '~/components/navbar';

export const Route = createRootRoute({
  component: () => (
    <div
      className={css({
        w: 'screen',
        h: 'screen',
        overflow: 'auto',
        scrollBehavior: 'smooth',
        scrollbar: 'hidden',
      })}
    >
      <Navbar />
      <div style={{ height: navbarHeightInPx }} />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  ),
});
