import { useStore } from '@nanostores/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useMatch, useRouter } from '@tanstack/react-router';
import {
  ChevronRightIcon,
  ChevronUpIcon,
  HeartPulseIcon,
  InfoIcon,
  PlayCircleIcon,
  PlusIcon,
  RotateCcwIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { type Plugin, cli, tauri } from '~/api';
import { EasyTooltip } from '~/components/easy-tooltip';
import { useDebounce } from '~/hooks/debounce';
import { queryClient } from '~/lib/query-client';
import { Badge } from '~/shadcn/badge';
import { Button } from '~/shadcn/button';
import { Input } from '~/shadcn/input';
import { $drawerOpen } from '~/stores/drawer';
import { $project } from '~/stores/project';
import { cn } from '~/utils';

import { LoaderIcon } from './LoaderIcon';

export const SidebarContent: React.FC = () => {
  const project = useStore($project);
  const router = useRouter();
  const asdfHelp = useQuery(cli.asdf.runtime.help());
  const asdfPluginList = useQuery(cli.asdf.plugin.list({ cwd: project }));
  const pluginUpdateAllMutation = useMutation(cli.asdf.plugin.updateAll());

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const plugins = useMemo<Plugin[] | undefined>(() => {
    if (!asdfPluginList.data) return;
    return asdfPluginList.data.filter((p) => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [asdfPluginList.data, debouncedSearch]);

  useEffect(() => {
    if (asdfHelp.isError) {
      void router.navigate({ to: '/asdf/doctor' });
    }
  }, [asdfHelp.isError, router]);

  if (asdfHelp.isError)
    return (
      <div className="flex flex-col p-4 gap-2">
        <p>
          <code>asdf</code> is not installed
        </p>
        <Link to="/asdf/doctor">
          <Button size="sm">Open doctor</Button>
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col">
      <div className="flex justify-center w-96">
        <div className="flex p-4 justify-between gap-4">
          <Input className="flex-1" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="gap-2 flex">
            <EasyTooltip tooltip="Update all plugins">
              <Button
                disabled={pluginUpdateAllMutation.isPending}
                variant="outline"
                size="icon"
                onClick={() => {
                  toast.promise(pluginUpdateAllMutation.mutateAsync({}), {
                    loading: 'Updating plugins',
                    success: 'Done updating plugins',
                    error: 'Failed to update plugins',
                  });
                }}
              >
                {pluginUpdateAllMutation.isPending ? <LoaderIcon /> : <ChevronUpIcon />}
              </Button>
            </EasyTooltip>
            <Link to="/asdf/plugins" onClick={() => $drawerOpen.set(false)}>
              <EasyTooltip tooltip="Add plugin">
                <Button variant="outline" size="icon">
                  <PlusIcon />
                </Button>
              </EasyTooltip>
            </Link>
            <EasyTooltip tooltip="Refresh">
              <Button
                disabled={asdfPluginList.isFetching}
                variant="outline"
                size="icon"
                onClick={() => {
                  void queryClient.invalidateQueries(cli.asdf.plugin.list());
                  toast.success('Refreshed');
                }}
              >
                {asdfPluginList.isFetching ? <LoaderIcon /> : <RotateCcwIcon />}
              </Button>
            </EasyTooltip>
          </div>
        </div>
      </div>
      <ul className="w-96 flex flex-col">
        {plugins?.length === 0 && (
          <li className="flex justify-center w-full rounded-md p-4 hover:bg-muted">
            <div className="flex flex-col gap-2">
              <p>No plugins found</p>
              <Link to="/asdf/plugins">
                <Button size="sm">Add plugin</Button>
              </Link>
            </div>
          </li>
        )}
        {plugins?.map((plugin, index) => <Row key={plugin.name} {...plugin} index={index} />)}
      </ul>
    </div>
  );
};

const Row: React.FC<Plugin & { index: number }> = ({ name }) => {
  const match = useMatch({
    from: '/asdf/_layout/tool/$toolName',
    shouldThrow: false,
    select: (m) => (m.params.toolName === name ? m : undefined),
  });
  const project = useStore($project);
  const currentQuery = useQuery(cli.asdf.runtime.current(name, { cwd: project }));
  const current = currentQuery.data?.[0];
  const normalizedProject = useQuery(tauri.path.normalize(project)).data;
  const normalizedCurrent = useQuery(
    tauri.path.normalize(current?.toolVersionLocation?.replace('/.tool-versions', '') ?? '/home'),
  ).data;

  const isProjectTool = normalizedProject && normalizedCurrent && normalizedProject === normalizedCurrent;

  return (
    <li className="flex justify-center w-full">
      <Link
        to="/asdf/tool/$toolName"
        params={{ toolName: name }}
        className={cn('hover:bg-muted w-full rounded-md p-4', { 'bg-muted': !!match })}
        onClick={() => {
          $drawerOpen.set(false);
        }}
      >
        <div className="flex w-full justify-between">
          <div className="flex flex-col gap-2 items-start">
            <code>{name}</code>
            {isProjectTool && <Badge variant="outline">Current project</Badge>}
          </div>
          {current?.version && <code>{current.version}</code>}
        </div>
      </Link>
    </li>
  );
};

export const SidebarFooterContent: React.FC = () => {
  const asdfHelp = useQuery(cli.asdf.runtime.help());
  const project = useStore($project);
  const selectDirectoryMutation = useMutation(
    tauri.dialog.open({ directory: true, title: 'Select project directory', multiple: false, defaultPath: project }),
  );

  return (
    <div className="flex justify-end gap-2 p-4">
      {import.meta.env.DEV && (
        <Link to="/asdf/playground">
          <EasyTooltip tooltip="Playground">
            <Button variant="outline" size="icon">
              <PlayCircleIcon />
            </Button>
          </EasyTooltip>
        </Link>
      )}
      <Link to="/asdf/about" onClick={() => $drawerOpen.set(false)}>
        <EasyTooltip tooltip="About">
          <Button variant="outline" size="icon">
            <InfoIcon />
          </Button>
        </EasyTooltip>
      </Link>
      <Link to="/asdf/doctor" onClick={() => $drawerOpen.set(false)}>
        <EasyTooltip tooltip="Doctor">
          <Button variant="outline" size="icon">
            <HeartPulseIcon />
          </Button>
        </EasyTooltip>
      </Link>
      <Button
        variant="outline"
        disabled={asdfHelp.isError}
        onClick={() => {
          void selectDirectoryMutation.mutateAsync({}).then((dir) => {
            if (dir.length > 1 && dir.endsWith('/')) dir = dir.slice(0, -1);
            $project.set(dir);
          });
        }}
      >
        Open project
        <ChevronRightIcon />
      </Button>
    </div>
  );
};
