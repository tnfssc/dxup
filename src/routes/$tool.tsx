import { useStore } from '@nanostores/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { CheckIcon, DownloadIcon, LaptopMinimalIcon, LoaderCircleIcon, TrashIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { css } from 'styled-system/css';
import { Center, HStack, VStack } from 'styled-system/jsx';
import { center, vstack } from 'styled-system/patterns';

import { type Runtime, cli } from '~/api';
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

export const Route = createFileRoute('/$tool')({
  loader: async ({ params }) => {
    if (!$project.value) return;
    await queryClient.ensureQueryData(cli.asdf.runtime.list(params.tool, { cwd: $project.value }));
    await queryClient.ensureQueryData(cli.asdf.runtime.current(params.tool, { cwd: $project.value }));
  },
  component: Page,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

const Row: React.FC<Runtime['versions'][0] & { installed: boolean; index: number; toolName: string }> = (v) => {
  const project = useStore($project);
  const toast = useToast();
  const installMutation = useMutation(cli.asdf.runtime.install());
  const uninstallMutation = useMutation(cli.asdf.runtime.uninstall());
  const changeVersionMutation = useMutation(cli.asdf.runtime.global());

  return (
    <li className={center({ _hover: { bg: 'bg.emphasized' }, w: 'md', rounded: 'md', p: '4' })}>
      <HStack w="full" justify="space-between">
        <VStack gap="2" alignItems="start">
          <Code>{v.version}</Code>
          <HStack gap="2">
            {v.installed && <Badge variant="outline">Installed</Badge>}
            {v.inUse && <Badge variant="outline">In use</Badge>}
          </HStack>
        </VStack>
        <HStack gap="2">
          {v.installed && (
            <EasyTooltip tooltip={!v.inUse && 'Switch to this version'}>
              <IconButton
                disabled={v.inUse || changeVersionMutation.isPending}
                variant="ghost"
                size="sm"
                onClick={() =>
                  changeVersionMutation.mutate({ toolName: v.toolName, version: v.version, options: { cwd: project } })
                }
              >
                {changeVersionMutation.isPending ? (
                  <LoaderCircleIcon className={css({ animation: 'spin' })} />
                ) : (
                  <CheckIcon />
                )}
              </IconButton>
            </EasyTooltip>
          )}
          {v.installed && (
            <EasyTooltip tooltip="Uninstall">
              <IconButton
                disabled={uninstallMutation.isPending}
                colorPalette="red"
                variant="ghost"
                size="sm"
                onClick={() =>
                  uninstallMutation.mutate({ toolName: v.toolName, version: v.version, options: { cwd: project } })
                }
              >
                {uninstallMutation.isPending ? (
                  <LoaderCircleIcon className={css({ animation: 'spin' })} />
                ) : (
                  <TrashIcon />
                )}
              </IconButton>
            </EasyTooltip>
          )}
          {!v.installed && (
            <EasyTooltip tooltip="Install">
              <IconButton
                disabled={installMutation.isPending}
                variant="ghost"
                size="sm"
                onClick={() => {
                  toast.promise(
                    installMutation.mutateAsync({
                      toolName: v.toolName,
                      version: v.version,
                      options: { cwd: project },
                    }),
                    {
                      loading: {
                        title: 'Installing',
                        description: `${v.toolName} ${v.version}`,
                      },
                      success: {
                        title: 'Installed',
                        description: `${v.toolName} ${v.version}`,
                      },
                      error: {
                        title: 'Failed to install',
                        description: `${v.toolName} ${v.version}`,
                      },
                    },
                  );
                }}
              >
                {installMutation.isPending ? (
                  <LoaderCircleIcon className={css({ animation: 'spin' })} />
                ) : (
                  <DownloadIcon />
                )}
              </IconButton>
            </EasyTooltip>
          )}
        </HStack>
      </HStack>
    </li>
  );
};

function Page() {
  const { tool } = useParams({ from: '/$tool' });
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

  return (
    <div>
      <Center>
        <HStack p="4" w="md" justify="space-between" alignItems="center">
          <Input maxW="48" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <HStack gap="2">
            <EasyTooltip
              tooltip={
                !(current?.version === 'system' || changeVersionMutation.isPending) && 'Switch to system version'
              }
            >
              <IconButton
                disabled={current?.version === 'system' || changeVersionMutation.isPending}
                variant="ghost"
                size="sm"
                onClick={() =>
                  changeVersionMutation.mutate({ toolName: tool, version: 'system', options: { cwd: project } })
                }
              >
                {changeVersionMutation.isPending ? (
                  <LoaderCircleIcon className={css({ animation: 'spin' })} />
                ) : (
                  <LaptopMinimalIcon />
                )}
              </IconButton>
            </EasyTooltip>
          </HStack>
        </HStack>
      </Center>
      <ul className={vstack()}>
        {versions?.map((v, index) => <Row key={v.version} {...v} index={index} toolName={tool} />)}
      </ul>
    </div>
  );
}
