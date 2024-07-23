import { useStore } from '@nanostores/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { DownloadIcon, LoaderCircleIcon, RotateCcwIcon, TrashIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { css } from 'styled-system/css';
import { Center, HStack, VStack } from 'styled-system/jsx';
import { center, vstack } from 'styled-system/patterns';

import { type Plugin, cli } from '~/api';
import { RouteError } from '~/components/route-error';
import { RoutePending } from '~/components/route-pending';
import { useDebounce } from '~/hooks/debounce';
import { useToast } from '~/hooks/toaster';
import { queryClient } from '~/lib/query-client';
import { $project } from '~/stores/project';
import { Badge } from '~/ui/badge';
import { Code } from '~/ui/code';
import { EasyTooltip } from '~/ui/easy-tooltip';
import { IconButton } from '~/ui/icon-button';
import { Input } from '~/ui/input';

export const Route = createFileRoute('/plugins')({
  loader: async () => {
    if (!$project.value) return;
    await queryClient.ensureQueryData(cli.asdf.plugin.list({ cwd: $project.value }));
    await queryClient.ensureQueryData(cli.asdf.plugin.listAll({ cwd: $project.value }));
  },
  component: Page,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

const Row: React.FC<Plugin & { index: number }> = ({ name, url, installed }) => {
  const project = useStore($project);
  const toast = useToast();

  const addMutation = useMutation(cli.asdf.plugin.add());
  const removeMutation = useMutation(cli.asdf.plugin.remove());

  return (
    <li className={center({ _hover: { bg: 'bg.emphasized' }, w: 'md', rounded: 'md', p: '4' })}>
      <HStack w="full" justify="space-between">
        <VStack gap="2" alignItems="start">
          <button
            className={css({ cursor: 'pointer' })}
            onClick={() => {
              void open(url);
            }}
          >
            <Code>{name}</Code>
          </button>
        </VStack>
        <HStack gap="2">
          {installed && <Badge variant="outline">Added</Badge>}
          {installed && (
            <EasyTooltip tooltip="Remove">
              <IconButton
                disabled={removeMutation.isPending}
                colorPalette="red"
                variant="ghost"
                size="sm"
                onClick={() => removeMutation.mutate({ toolName: name, options: { cwd: project } })}
              >
                {removeMutation.isPending ? <LoaderCircleIcon className={css({ animation: 'spin' })} /> : <TrashIcon />}
              </IconButton>
            </EasyTooltip>
          )}
          {!installed && (
            <EasyTooltip tooltip="Add">
              <IconButton
                disabled={addMutation.isPending}
                variant="ghost"
                size="sm"
                onClick={() => {
                  toast.promise(
                    addMutation.mutateAsync({
                      toolName: name,
                      options: { cwd: project },
                    }),
                    {
                      loading: {
                        title: 'Adding',
                        description: name,
                      },
                      success: {
                        title: 'Done adding',
                        description: name,
                      },
                      error: {
                        title: 'Failed to add',
                        description: name,
                      },
                    },
                  );
                }}
              >
                {addMutation.isPending ? <LoaderCircleIcon className={css({ animation: 'spin' })} /> : <DownloadIcon />}
              </IconButton>
            </EasyTooltip>
          )}
        </HStack>
      </HStack>
    </li>
  );
};

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
        return 0;
      });
  }, [allPluginsQuery.data, debouncedSearch]);

  return (
    <div>
      <Center>
        <HStack p="4" w="md" justify="space-between">
          <Input maxW="48" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <HStack gap="2">
            <EasyTooltip tooltip="Update all plugins">
              <IconButton
                disabled={allPluginsQuery.isPending}
                variant="outline"
                size="sm"
                onClick={() => {
                  void allPluginsQuery.refetch();
                }}
              >
                {allPluginsQuery.isPending ? (
                  <LoaderCircleIcon className={css({ animation: 'spin' })} />
                ) : (
                  <RotateCcwIcon />
                )}
              </IconButton>
            </EasyTooltip>
          </HStack>
        </HStack>
      </Center>
      <ul className={vstack()}>
        {plugins?.map((plugin, index) => <Row key={plugin.name} {...plugin} index={index} />)}
      </ul>
    </div>
  );
}
