import { useStore } from '@nanostores/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DownloadIcon, RotateCcwIcon, TrashIcon } from 'lucide-react';
import { Fragment, forwardRef, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { type Plugin, cli } from '~/api';
import { LoaderIcon } from '~/components/LoaderIcon';
import { EasyTooltip } from '~/components/easy-tooltip';
import { useDebounce } from '~/hooks/debounce';
import { Badge } from '~/shadcn/badge';
import { Button } from '~/shadcn/button';
import { Input } from '~/shadcn/input';
import { $project } from '~/stores/project';

export const Route = createFileRoute('/asdf/_layout/plugins')({
  component: Page,
});

const Row = forwardRef<HTMLLIElement, Plugin & { index: number; start: number }>(
  ({ name, url, installed, index, start }, ref) => {
    const project = useStore($project);

    const addMutation = useMutation(cli.asdf.plugin.add());
    const removeMutation = useMutation(cli.asdf.plugin.remove());

    return (
      <li
        ref={ref}
        data-index={index}
        style={{
          transform: `translateY(${start}px)`,
        }}
        className="flex justify-center w-full rounded-md p-4 absolute top-0 left-0 hover:bg-secondary"
      >
        <div className="flex w-96 justify-between">
          <div className="flex flex-col gap-2 items-start">
            <button
              className="cursor-pointer"
              onClick={() => {
                void open(url);
              }}
            >
              <code>{name}</code>
            </button>
          </div>
          <div className="flex gap-2">
            {installed && <Badge variant="outline">Added</Badge>}
            {installed && (
              <EasyTooltip tooltip="Remove">
                <Button
                  disabled={removeMutation.isPending}
                  variant="destructive"
                  size="icon"
                  onClick={() => removeMutation.mutate({ toolName: name, options: { cwd: project } })}
                >
                  {removeMutation.isPending ? <LoaderIcon /> : <TrashIcon />}
                </Button>
              </EasyTooltip>
            )}
            {!installed && (
              <EasyTooltip tooltip="Add">
                <Button
                  disabled={addMutation.isPending}
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    toast.promise(
                      addMutation.mutateAsync({
                        toolName: name,
                        options: { cwd: project },
                      }),
                      {
                        loading: `Adding ${name}`,
                        success: `Done adding ${name}`,
                        error: `Failed to add ${name}`,
                      },
                    );
                  }}
                >
                  {addMutation.isPending ? <LoaderIcon /> : <DownloadIcon />}
                </Button>
              </EasyTooltip>
            )}
          </div>
        </div>
      </li>
    );
  },
);

Row.displayName = 'Row';

const topPlugins = ['nodejs', 'python', 'golang', 'rust', 'java'];

function Page() {
  const project = useStore($project);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const allPluginsQuery = useQuery(cli.asdf.plugin.listAll({ cwd: project }));

  const plugins = useMemo<Plugin[] | undefined>(() => {
    if (!allPluginsQuery.data) return;
    return allPluginsQuery.data
      .filter((p) => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .sort((a, b) => {
        if (a.installed && !b.installed) return -1;
        if (!a.installed && b.installed) return 1;
        if (topPlugins.includes(a.name) && !topPlugins.includes(b.name)) return -1;
        if (!topPlugins.includes(a.name) && topPlugins.includes(b.name)) return 1;
        return 0;
      });
  }, [allPluginsQuery.data, debouncedSearch]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: plugins?.length ?? 766,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 766,
    overscan: 10,
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-center">
        <div className="flex p-4 justify-between items-center gap-2">
          <Input className="max-w-48" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex gap-2">
            <EasyTooltip tooltip="Refresh">
              <Button
                disabled={allPluginsQuery.isPending}
                variant="outline"
                size="icon"
                onClick={() => {
                  void allPluginsQuery.refetch();
                }}
              >
                {allPluginsQuery.isPending ? <LoaderIcon /> : <RotateCcwIcon />}
              </Button>
            </EasyTooltip>
          </div>
        </div>
      </div>
      <div className="flex justify-center flex-1 relative">
        <div className="absolute top-0 bottom-0 left-0 right-0 overflow-auto" ref={parentRef}>
          <ul
            className="flex flex-col relative w-full items-center"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const plugin = plugins?.[virtualItem.index];
              if (!plugin) return <Fragment key={virtualItem.key} />;
              return (
                <Row
                  {...plugin}
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
