import { useStore } from '@nanostores/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { open } from '@tauri-apps/api/shell';
import {
  CheckIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  LaptopMinimalIcon,
  LoaderCircleIcon,
  PlusIcon,
  RotateCcwIcon,
  SettingsIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { Button } from '~/ui/button';
import { Code } from '~/ui/code';
import { EasyTooltip } from '~/ui/easy-tooltip';
import { IconButton } from '~/ui/icon-button';
import { Input } from '~/ui/input';
import * as Select from '~/ui/select';
import { Text } from '~/ui/text';

export const Route = createFileRoute('/')({
  component: Page,
  errorComponent: RouteError,
  pendingComponent: RoutePending,
});

const Row: React.FC<Plugin & { index: number }> = ({ name, url }) => {
  const project = useStore($project);
  const asdfGlobal = useMutation(cli.asdf.runtime.global());
  const versionsQuery = useQuery(cli.asdf.runtime.list(name, { cwd: project }));
  const versions = versionsQuery.data?.[0]?.versions;
  const currentQuery = useQuery(cli.asdf.runtime.current(name, { cwd: project }));
  const router = useRouter();

  useEffect(() => {
    if (versionsQuery.isPending) return;
    if (versionsQuery.isError) {
      void router.navigate({ to: '/doctor' });
    }
  }, [versionsQuery.isError, versionsQuery.isPending, router]);

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
          {versions && currentQuery.data ? (
            <Select.Root
              disabled={asdfGlobal.isPending}
              positioning={{ sameWidth: true }}
              w="36"
              size="sm"
              items={versions.map(({ version: v }) => ({ value: v, label: v }))}
              value={currentQuery.data[0]?.version ? [currentQuery.data[0].version] : []}
              onValueChange={(e) =>
                asdfGlobal.mutate({ toolName: name, version: e.value[0], options: { cwd: project } })
              }
            >
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select a version" />
                  <ChevronsUpDownIcon />
                </Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  <Select.ItemGroup>
                    {versions.map(({ version: v }) => (
                      <Select.Item key={v} item={v}>
                        <Select.ItemText>{v}</Select.ItemText>
                        <Select.ItemIndicator>
                          <CheckIcon />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.ItemGroup>
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          ) : (
            'Loading...'
          )}
          <EasyTooltip tooltip="Switch to system version">
            <IconButton
              disabled={
                !currentQuery.data?.[0]?.toolVersionLocation ||
                currentQuery.data[0]?.version === 'system' ||
                asdfGlobal.isPending
              }
              variant="outline"
              size="sm"
              onClick={() => asdfGlobal.mutate({ toolName: name, version: 'system', options: { cwd: project } })}
            >
              {asdfGlobal.isPending ? (
                <LoaderCircleIcon className={css({ animation: 'spin' })} />
              ) : (
                <LaptopMinimalIcon />
              )}
            </IconButton>
          </EasyTooltip>
          <Link to="/$tool" params={{ tool: name }}>
            <EasyTooltip tooltip="Configure">
              <IconButton variant="outline" size="sm">
                <SettingsIcon />
              </IconButton>
            </EasyTooltip>
          </Link>
        </HStack>
      </HStack>
    </li>
  );
};

function Page() {
  const project = useStore($project);
  const toast = useToast();
  const asdfPluginList = useQuery(cli.asdf.plugin.list({ cwd: project }));
  const pluginUpdateAllMutation = useMutation(cli.asdf.plugin.updateAll());

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const plugins = useMemo<Plugin[] | undefined>(() => {
    if (!asdfPluginList.data) return;
    return asdfPluginList.data.filter((p) => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [asdfPluginList.data, debouncedSearch]);

  return (
    <div>
      <Center>
        <HStack p="4" w="md" justify="space-between">
          <Input maxW="48" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <HStack gap="2">
            <EasyTooltip tooltip="Update all plugins">
              <IconButton
                disabled={pluginUpdateAllMutation.isPending}
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.promise(pluginUpdateAllMutation.mutateAsync({}), {
                    loading: {
                      title: 'Updating plugins',
                    },
                    success: {
                      title: 'Done updating plugins',
                    },
                    error: {
                      title: 'Failed to update plugins',
                    },
                  });
                }}
              >
                {pluginUpdateAllMutation.isPending ? (
                  <LoaderCircleIcon className={css({ animation: 'spin' })} />
                ) : (
                  <ChevronUpIcon />
                )}
              </IconButton>
            </EasyTooltip>
            <Link to="/plugins">
              <EasyTooltip tooltip="Add plugin">
                <IconButton variant="outline" size="sm">
                  <PlusIcon />
                </IconButton>
              </EasyTooltip>
            </Link>
            <EasyTooltip tooltip="Refresh">
              <IconButton
                disabled={asdfPluginList.isFetching}
                variant="outline"
                size="sm"
                onClick={() => {
                  void queryClient.invalidateQueries(cli.asdf.plugin.list());
                  toast.success({ title: 'Refreshed' });
                }}
              >
                {asdfPluginList.isFetching ? (
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
        {plugins?.length === 0 && (
          <li className={center({ _hover: { bg: 'bg.emphasized' }, w: 'md', rounded: 'md', p: '4' })}>
            <VStack gap="2">
              <Text>No plugins found</Text>
              <Link to="/plugins">
                <Button size="sm">Add plugin</Button>
              </Link>
            </VStack>
          </li>
        )}
        {plugins?.map((plugin, index) => <Row key={plugin.name} {...plugin} index={index} />)}
      </ul>
    </div>
  );
}
