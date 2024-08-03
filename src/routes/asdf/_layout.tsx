import { useStore } from '@nanostores/react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

import { cli, tauri } from '~/api';
import { EasyTooltip } from '~/components/easy-tooltip';
import { SidebarContent, SidebarFooterContent } from '~/components/sidebar';
import { $project } from '~/stores/project';
import { cn } from '~/utils';

export const Route = createFileRoute('/asdf/_layout')({
  component: Layout,
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
    let dir = homeDir.data;
    if (dir.length > 1 && dir.endsWith('/')) dir = dir.slice(0, -1);
    $project.set(dir);
  }, [homeDir.data, project]);

  useEffect(() => {
    if (asdfHelp.isPending) return;
    if (asdfHelp.isError) {
      void router.navigate({ to: '/asdf/doctor' });
    }
  }, [asdfHelp.isError, asdfHelp.isPending, router]);

  if (!project && !asdfHelp.isPending) return null;

  return (
    <div className={cn('h-screen w-screen overflow-auto scroll-smooth')}>
      <div className="flex">
        <div className="flex max-h-screen max-w-md flex-col overflow-auto">
          <EasyTooltip tooltip="Current project">
            <div className="p-4 pb-0">
              <code>{project}</code>
            </div>
          </EasyTooltip>
          <SidebarContent />
          <SidebarFooterContent />
        </div>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
