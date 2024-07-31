import { useStore } from '@nanostores/react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { css } from 'styled-system/css';
import { Box } from 'styled-system/jsx';

import { cli, tauri } from '~/api';
import { RouteError } from '~/components/route-error';
import { RoutePending } from '~/components/route-pending';
import { SidebarContent, SidebarFooterContent } from '~/components/sidebar';
import { $project } from '~/stores/project';
import { Code } from '~/ui/code';
import { EasyTooltip } from '~/ui/easy-tooltip';

export const Route = createFileRoute('/tools/_layout')({
  component: Layout,
  errorComponent: RouteError,
  pendingComponent: RoutePending,
});

function Layout() {
  const _project = useStore($project);
  const project = useQuery(tauri.path.normalize(_project)).data ?? _project;
  const homeDir = useQuery(cli.homeDir());
  const asdfHelp = useQuery(cli.asdf.runtime.help());
  const router = useRouter();

  useEffect(() => {
    if (project) return;
    if (!homeDir.data) return;
    $project.set(homeDir.data);
  }, [homeDir.data, project]);

  useEffect(() => {
    if (asdfHelp.isPending) return;
    if (asdfHelp.isError) {
      void router.navigate({ to: '/tools/doctor' });
    }
  }, [asdfHelp.isError, asdfHelp.isPending, router]);

  if (!project && !asdfHelp.isPending) return null;

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
      <Box display="flex">
        <Box maxW="md" display="flex" flexDir="column" maxH="screen" overflow="auto">
          <EasyTooltip tooltip="Current project">
            <Box p="4" pb="0">
              <Code>{project}</Code>
            </Box>
          </EasyTooltip>
          <SidebarContent />
          <SidebarFooterContent />
        </Box>
        <Box flex="1">
          <Outlet />
        </Box>
      </Box>
    </div>
  );
}
