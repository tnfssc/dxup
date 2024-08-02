import { useStore } from '@nanostores/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useMatch, useRouter } from '@tanstack/react-router';
import {
  ChevronRightIcon,
  ChevronUpIcon,
  HeartPulseIcon,
  InfoIcon,
  LoaderCircleIcon,
  MenuIcon,
  PlayCircleIcon,
  PlusIcon,
  RotateCcwIcon,
  XIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { css } from 'styled-system/css';
import { Box, Center, HStack, VStack } from 'styled-system/jsx';
import { center, vstack } from 'styled-system/patterns';

import { type Plugin, cli, tauri } from '~/api';
import { useDebounce } from '~/hooks/debounce';
import { useToast } from '~/hooks/toaster';
import { queryClient } from '~/lib/query-client';
import { $drawerOpen } from '~/stores/drawer';
import { $project } from '~/stores/project';
import { Badge } from '~/ui/badge';
import { Button } from '~/ui/button';
import { Code } from '~/ui/code';
import * as Drawer from '~/ui/drawer';
import { EasyTooltip } from '~/ui/easy-tooltip';
import { IconButton } from '~/ui/icon-button';
import { Input } from '~/ui/input';
import { Text } from '~/ui/text';

import { FloatingActionButton } from './floating-action-button';

export interface SidebarDrawerProps extends Drawer.RootProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerContent?: React.ReactNode;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ children, title, subtitle, footerContent, ...props }) => {
  return (
    <Drawer.Root variant="left" immediate {...props}>
      <Drawer.Trigger asChild>
        <FloatingActionButton aria-label="Drawer" variant="ghost">
          <MenuIcon />
        </FloatingActionButton>
      </Drawer.Trigger>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{title}</Drawer.Title>
            <Drawer.Description>
              <Code css={{ maxW: 'xs' }}>
                <span className={css({ textOverflow: 'ellipsis', overflow: 'hidden' })}>{subtitle}</span>
              </Code>
            </Drawer.Description>
            <Drawer.CloseTrigger asChild position="absolute" top="3" right="4">
              <IconButton variant="ghost">
                <XIcon />
              </IconButton>
            </Drawer.CloseTrigger>
          </Drawer.Header>
          <Drawer.Body p="0">{children}</Drawer.Body>
          <Drawer.Footer gap="3">{footerContent}</Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};

export const SidebarContent: React.FC = () => {
  const project = useStore($project);
  const toast = useToast();
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
      void router.navigate({ to: '/tools/doctor' });
    }
  }, [asdfHelp.isError, router]);

  if (asdfHelp.isError)
    return (
      <VStack p="4" gap="2">
        <Text>
          <Code>asdf</Code> is not installed
        </Text>
        <Link to="/tools/doctor">
          <Button size="sm">Open doctor</Button>
        </Link>
      </VStack>
    );

  return (
    <VStack>
      <Center w="sm">
        <HStack p="4" justify="space-between">
          <Input flex="1" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <Link to="/tools/plugins" onClick={() => $drawerOpen.set(false)}>
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
      <ul className={vstack({ w: 'sm' })}>
        {plugins?.length === 0 && (
          <li className={center({ _hover: { bg: 'bg.emphasized' }, w: 'md', rounded: 'md', p: '4' })}>
            <VStack gap="2">
              <Text>No plugins found</Text>
              <Link to="/tools/plugins">
                <Button size="sm">Add plugin</Button>
              </Link>
            </VStack>
          </li>
        )}
        {plugins?.map((plugin, index) => <Row key={plugin.name} {...plugin} index={index} />)}
      </ul>
    </VStack>
  );
};

const Row: React.FC<Plugin & { index: number }> = ({ name }) => {
  const match = useMatch({
    from: '/tools/_layout/tool/$toolName',
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
    <li className={center({ w: 'full' })}>
      <Link
        to="/tools/tool/$toolName"
        params={{ toolName: name }}
        className={center({
          _hover: { bg: 'bg.emphasized' },
          w: 'full',
          rounded: 'md',
          p: '4',
          ...(match && { bg: 'bg.emphasized' }),
        })}
        onClick={() => {
          $drawerOpen.set(false);
        }}
      >
        <HStack w="full" justify="space-between">
          <VStack gap="2" alignItems="start">
            <Code>{name}</Code>
            {isProjectTool && <Badge variant="outline">Current project</Badge>}
          </VStack>
          {current?.version && <Code>{current.version}</Code>}
        </HStack>
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
    <Box display="flex" justifyContent="flex-end" gap="2" p="4">
      {import.meta.env.DEV && (
        <Link to="/tools/playground">
          <EasyTooltip tooltip="Playground">
            <IconButton variant="outline">
              <PlayCircleIcon />
            </IconButton>
          </EasyTooltip>
        </Link>
      )}
      <Link to="/tools/about" onClick={() => $drawerOpen.set(false)}>
        <EasyTooltip tooltip="About">
          <IconButton variant="outline">
            <InfoIcon />
          </IconButton>
        </EasyTooltip>
      </Link>
      <Link to="/tools/doctor" onClick={() => $drawerOpen.set(false)}>
        <EasyTooltip tooltip="Doctor">
          <IconButton variant="outline">
            <HeartPulseIcon />
          </IconButton>
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
    </Box>
  );
};
