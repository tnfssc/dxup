import { useStore } from '@nanostores/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckIcon, DownloadIcon, LaptopMinimalIcon, LoaderCircleIcon, RotateCcwIcon, TrashIcon } from 'lucide-react';
import { Fragment, forwardRef, useMemo, useRef, useState } from 'react';
import { css } from 'styled-system/css';
import { Box, Center, HStack, VStack } from 'styled-system/jsx';
import { center, vstack } from 'styled-system/patterns';

import { type Runtime, cli, tauri } from '~/api';
import { useDebounce } from '~/hooks/debounce';
import { useToast } from '~/hooks/toaster';
import { $project } from '~/stores/project';
import { Badge } from '~/ui/badge';
import { Code } from '~/ui/code';
import { EasyTooltip } from '~/ui/easy-tooltip';
import { IconButton } from '~/ui/icon-button';
import { Input } from '~/ui/input';

export const Route = createFileRoute('/tools/_layout/tool/$toolName')({
  component: Page,
});

const Row = forwardRef<
  HTMLLIElement,
  Runtime['versions'][0] & { installed: boolean; index: number; toolName: string; start: number }
>((v, ref) => {
  const project = useStore($project);
  const toast = useToast();
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
      className={center({
        _hover: { bg: 'bg.emphasized' },
        w: 'full',
        rounded: 'md',
        p: '4',
        position: 'absolute',
        top: '0',
        left: '0',
      })}
    >
      <HStack w="md" justify="space-between">
        <VStack gap="2" alignItems="start">
          <Code>{v.version}</Code>
          <HStack gap="2">
            {v.installed && <Badge variant="outline">Installed</Badge>}
            {v.inUse && <Badge variant="outline">In use</Badge>}
          </HStack>
        </VStack>
        <HStack gap="2">
          {v.installed && (
            <EasyTooltip tooltip={inUse && 'Switch to this version'}>
              <IconButton
                disabled={inUse || changeVersionMutation.isPending}
                variant="ghost"
                size="sm"
                onClick={() =>
                  changeVersionMutation.mutate({
                    toolName: v.toolName,
                    version: v.version,
                    options: { cwd: project },
                  })
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
});

Row.displayName = 'Row';

function Page() {
  const { toolName: tool } = useParams({ from: '/tools/_layout/tool/$toolName' });
  const toast = useToast();
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
    <Box h="screen" display="flex" flexDir="column">
      <Center>
        <HStack p="4" justify="space-between" alignItems="center">
          <Code>{tool}</Code>
          <Input flex="1" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <EasyTooltip tooltip="Refresh">
              <IconButton
                disabled={allVersionsQuery.isFetching}
                variant="outline"
                size="sm"
                onClick={() => {
                  void allVersionsQuery.refetch();
                  toast.success({ title: 'Refreshed' });
                }}
              >
                {allVersionsQuery.isFetching ? (
                  <LoaderCircleIcon className={css({ animation: 'spin' })} />
                ) : (
                  <RotateCcwIcon />
                )}
              </IconButton>
            </EasyTooltip>
          </HStack>
        </HStack>
      </Center>
      <Center flex="1" pos="relative">
        <Box
          css={{
            pos: 'absolute',
            top: '0',
            bottom: '0',
            left: '0',
            right: '0',
            overflow: 'auto',
          }}
          ref={parentRef}
        >
          <ul
            className={vstack({ position: 'relative', w: 'full', alignItems: 'center' })}
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
        </Box>
      </Center>
    </Box>
  );
}
