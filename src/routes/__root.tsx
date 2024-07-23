import { useStore } from '@nanostores/react';
import { useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { useEffect } from 'react';
import { css } from 'styled-system/css';

import { cli } from '~/api';
import { Navbar, navbarHeightInPx } from '~/components/navbar';
import { $project } from '~/stores/project';

const Root = () => {
  const project = useStore($project);
  const homeDir = useQuery(cli.homeDir());

  useEffect(() => {
    if (project) return;
    if (!homeDir.data) return;
    $project.set(homeDir.data);
  }, [homeDir.data, project]);

  if (!project) return null;

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
      <Navbar />
      <div style={{ height: navbarHeightInPx }} />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </div>
  );
};

export const Route = createRootRoute({
  component: Root,
});
