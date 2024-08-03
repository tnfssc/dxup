import { useStore } from '@nanostores/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckIcon, DownloadIcon, LaptopMinimalIcon, RotateCcwIcon, TrashIcon } from 'lucide-react';
import { Fragment, forwardRef, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { type Runtime, cli, tauri } from '~/api';
import { LoaderIcon } from '~/components/LoaderIcon';
import { EasyTooltip } from '~/components/easy-tooltip';
import { useDebounce } from '~/hooks/debounce';
import { Badge } from '~/shadcn/badge';
import { Button } from '~/shadcn/button';
import { Input } from '~/shadcn/input';
import { $project } from '~/stores/project';
import { cn } from '~/utils';

export const Route = createFileRoute('/asdf/_layout/tool/$toolName')({
  component: Page,
});

const Row = forwardRef<
  HTMLLIElement,
  Runtime['versions'][0] & { installed: boolean; index: number; toolName: string; start: number }
>((v, ref) => {
  const project = useStore($project);
  const installMutation = useMutation(cli.asdf.runtime.install());
  const uninstallMutation = useMutation(cli.asdf.runtime.uninstall());
  const changeVersionMutation = useMutation(cli.asdf.runtime.global());

  const currentQuery = useQuery(cli.asdf.runtime.current(v.toolName, { cwd: project }));
  const current = currentQuery.data?.[0];
  const normalizedProject = useQuery(tauri.path.normalize(project)).data;
  const normalizedCurrent = useQuery(
    tauri.path.normalize(current?.toolVersionLocation?.replace('/.tool-versions', '') ?? '/home'),
  ).data;

  const isProjectTool = normalizedProject && normalizedCurrent && normalizedProject === normalizedCurrent;

  const inUse = !!isProjectTool && v.inUse;

  return (
    <li
      ref={ref}
      data-index={v.index}
      style={{
        transform: `translateY(${v.start}px)`,
      }}
      // className={center({
      //   _hover: { bg: 'bg.emphasized' },
      //   w: 'full',
      //   rounded: 'md',
      //   p: '4',
      //   position: 'absolute',
      //   top: '0',
      //   left: '0',
      // })}
      className={cn('flex justify-center w-full rounded-md p-4 absolute top-0 left-0 hover:bg-secondary')}
    >
      <div className="flex w-96 justify-between">
        <div className="flex flex-col gap-2 items-start">
          <code>{v.version}</code>
          <div className="flex gap-2">
            {v.installed && <Badge variant="outline">Installed</Badge>}
            {v.inUse && <Badge variant="outline">In use</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {v.installed && (
            <EasyTooltip tooltip={inUse && 'Switch to this version'}>
              <Button
                disabled={inUse || changeVersionMutation.isPending}
                variant="ghost"
                size="icon"
                onClick={() =>
                  changeVersionMutation.mutate({
                    toolName: v.toolName,
                    version: v.version,
                    options: { cwd: project },
                  })
                }
              >
                {changeVersionMutation.isPending ? <LoaderIcon /> : <CheckIcon />}
              </Button>
            </EasyTooltip>
          )}
          {v.installed && (
            <EasyTooltip tooltip="Uninstall">
              <Button
                disabled={uninstallMutation.isPending}
                variant="destructive"
                size="icon"
                onClick={() =>
                  uninstallMutation.mutate({ toolName: v.toolName, version: v.version, options: { cwd: project } })
                }
              >
                {uninstallMutation.isPending ? <LoaderIcon /> : <TrashIcon />}
              </Button>
            </EasyTooltip>
          )}
          {!v.installed && (
            <EasyTooltip tooltip="Install">
              <Button
                disabled={installMutation.isPending}
                variant="ghost"
                size="icon"
                onClick={() => {
                  toast.promise(
                    installMutation.mutateAsync({
                      toolName: v.toolName,
                      version: v.version,
                      options: { cwd: project },
                    }),
                    {
                      loading: `Installing ${v.toolName} ${v.version}`,
                      success: `Installed ${v.toolName} ${v.version}`,
                      error: `Failed to install ${v.toolName} ${v.version}`,
                    },
                  );
                }}
              >
                {installMutation.isPending ? <LoaderIcon /> : <DownloadIcon />}
              </Button>
            </EasyTooltip>
          )}
        </div>
      </div>
    </li>
  );
});

Row.displayName = 'Row';

function Page() {
  const { toolName: tool } = useParams({ from: '/asdf/_layout/tool/$toolName' });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const project = useStore($project);

  const changeVersionMutation = useMutation(cli.asdf.runtime.global());
  const allVersionsQuery = useQuery(cli.asdf.runtime.listAll(tool, { cwd: project }));
  const allVersions = allVersionsQuery.data;
  const installedVersionsQuery = useQuery(cli.asdf.runtime.list(tool, { cwd: project }));
  const installedVersions = installedVersionsQuery.data?.[0].versions;
  const currentQuery = useQuery(cli.asdf.runtime.current(tool, { cwd: project }));
  const current = currentQuery.data?.[0];

  const versions = useMemo<(Runtime['versions'][0] & { installed: boolean })[] | undefined>(() => {
    if (!installedVersions) return;
    if (!allVersions)
      return installedVersions.map((v) => ({ version: v.version, inUse: v.inUse, installed: true })).reverse();
    return allVersions
      .filter((v) => v.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .map((v) => ({
        version: v,
        inUse: v === current?.version,
        installed: !!installedVersions.find((i) => i.version === v),
      }))
      .sort((a, b) => {
        if (a.installed && !b.installed) return -1;
        if (!a.installed && b.installed) return 1;
        return 0;
      });
  }, [allVersions, current?.version, installedVersions, debouncedSearch]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: versions?.length ?? 100,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 10,
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-center">
        <div className="flex p-4 justify-between items-center">
          <code>{tool}</code>
          <Input className="flex" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex gap-2">
            <EasyTooltip
              tooltip={
                !(current?.version === 'system' || changeVersionMutation.isPending) && 'Switch to system version'
              }
            >
              <Button
                disabled={current?.version === 'system' || changeVersionMutation.isPending}
                variant="ghost"
                size="icon"
                onClick={() =>
                  changeVersionMutation.mutate({ toolName: tool, version: 'system', options: { cwd: project } })
                }
              >
                {changeVersionMutation.isPending ? <LoaderIcon /> : <LaptopMinimalIcon />}
              </Button>
            </EasyTooltip>
            <EasyTooltip tooltip="Refresh">
              <Button
                disabled={allVersionsQuery.isFetching}
                variant="outline"
                size="icon"
                onClick={() => {
                  void allVersionsQuery.refetch();
                  toast.success('Refreshed');
                }}
              >
                {allVersionsQuery.isFetching ? <LoaderIcon /> : <RotateCcwIcon />}
              </Button>
            </EasyTooltip>
          </div>
        </div>
      </div>
      {/* <Center flex="1" pos="relative"> */}
      <div className="flex justify-center flex-1 relative">
        <div className="absolute top-0 bottom-0 left-0 right-0 overflow-auto" ref={parentRef}>
          <ul
            className="flex flex-col relative w-full items-center"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const v = versions?.[virtualItem.index];
              if (!v) return <Fragment key={virtualItem.key} />;
              return (
                <Row
                  {...v}
                  toolName={tool}
                  index={virtualItem.index}
                  key={virtualItem.key}
                  ref={virtualItem.measureElement}
                  start={virtualItem.start}
                />
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
