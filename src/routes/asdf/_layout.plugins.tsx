import { useStore } from '@nanostores/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DownloadIcon, RotateCcwIcon, TrashIcon, XIcon } from 'lucide-react';
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
        className="absolute left-0 top-0 flex w-full justify-center rounded-md p-4 hover:bg-secondary"
      >
        <div className="flex w-96 justify-between">
          <div className="flex flex-col items-start gap-2">
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
                    const abortController = new AbortController();
                    toast.promise(
                      addMutation.mutateAsync({
                        toolName: name,
                        options: { cwd: project, signal: abortController.signal },
                      }),
                      {
                        loading: (
                          <div className="flex w-full items-center justify-between gap-2">
                            <span>Adding {name}</span>
                            <EasyTooltip tooltip="Abort">
                              <Button variant="ghost" size="icon" onClick={() => abortController.abort()}>
                                <XIcon />
                              </Button>
                            </EasyTooltip>
                          </div>
                        ),
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
    <div className="flex h-screen flex-col">
      <div className="flex justify-center">
        <div className="flex items-center justify-between gap-2 p-4">
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
      <div className="relative flex flex-1 justify-center">
        <div className="absolute bottom-0 left-0 right-0 top-0 overflow-auto" ref={parentRef}>
          <ul
            className="relative flex w-full flex-col items-center"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const plugin = plugins?.[virtualItem.index];
              if (!plugin) return <Fragment key={virtualItem.key} />;
              return (
                <Row
                  {...plugin}
                  index={virtualItem.index}
                  key={`${virtualItem.key}-${plugin.name}`}
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
