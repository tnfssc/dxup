import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { homeDir } from '@tauri-apps/api/path';
import { Command } from '@tauri-apps/api/shell';

import { queryClient } from '~/lib/query-client';

export class CommandError extends Error {
  constructor(
    message: string,
    public code: number | null,
  ) {
    super(message);
  }
  name = 'CommandError';
  static is(error: unknown): error is CommandError {
    return error instanceof CommandError;
  }
}

export interface Runtime {
  name: string;
  versions: { version: string; inUse: boolean }[];
}

function parseRuntimesList(input: string, toolName?: string): Runtime[] {
  const lines = input.split('\n').filter((line) => line.trim() !== '');
  const runtimesMap = new Map<string, Runtime>();

  let currentTool: string | null = null;

  if (toolName) {
    currentTool = toolName;
    runtimesMap.set(currentTool, { name: toolName, versions: [] });
  }

  for (const line of lines) {
    if (!line) continue;

    if (!line.startsWith(' ')) {
      currentTool = line.trim();
      if (runtimesMap.has(currentTool)) throw new Error('Unexpected duplicate tool');
      runtimesMap.set(currentTool, { name: currentTool, versions: [] });
    } else if (line.startsWith(' ')) {
      if (!currentTool) throw new Error('Unexpected line with no current tool');
      if (!runtimesMap.has(currentTool)) throw new Error('Unexpected line with no current tool');
      if (line.startsWith(' *'))
        runtimesMap.get(currentTool)!.versions.push({ version: line.replace('*', '').trim(), inUse: true });
      else runtimesMap.get(currentTool)!.versions.push({ version: line.trim(), inUse: false });
    }
  }

  return Array.from(runtimesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export interface CurrentRuntime {
  name: string;
  version: string | null;
  toolVersionLocation: string | null;
}

function parseCurrentRuntimeList(input: string, homeDir?: string): CurrentRuntime[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const [name, version, ..._tvLoc] = line.split(' ').filter((part) => part !== '');
      const isVersionUnset = version === '______';
      let toolVersionLocation = isVersionUnset ? null : _tvLoc.join(' ');
      if (homeDir && toolVersionLocation?.includes(homeDir))
        toolVersionLocation = toolVersionLocation.replace(homeDir, '~/');
      return {
        name,
        version: isVersionUnset ? null : version,
        toolVersionLocation,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface Plugin {
  name: string;
  url: string;
  installed: boolean;
}

function parsePluginList(input: string, installed?: true): Plugin[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' || line.includes('HEAD'))
    .map((line) => {
      // eslint-disable-next-line prefer-const
      let [name, url] = line.split(' ').filter((part) => part !== '');
      const isInstalled = !installed ? url.startsWith('*') : false;
      if (isInstalled) url = url.replace('*', '');
      return { name, url, installed: isInstalled };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function parsePath(_input: string, homeDir?: string): string[] {
  let input = _input;
  if (homeDir && input.startsWith(homeDir)) input = input.replace(homeDir, '~/');
  return input
    .split('/')
    .map((p) => p.trim())
    .filter((part) => part !== '');
}

export const api = {
  asdf: {
    runtime: {
      list(toolName?: string) {
        return {
          queryKey: ['list', toolName],
          queryFn: async () => {
            const args = ['list'];
            if (toolName) args.push(toolName);
            const command = new Command('asdf', args);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            return parseRuntimesList(stdout, toolName);
          },
        } satisfies UseQueryOptions<Runtime[]>;
      },
      current(toolName?: string) {
        return {
          queryKey: ['current', toolName],
          queryFn: async () => {
            const args = ['current'];
            if (toolName) args.push(toolName);
            const command = new Command('asdf', args);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            const homeDirectory = await queryClient.fetchQuery(api.homeDir());
            return parseCurrentRuntimeList(stdout, homeDirectory);
          },
        } satisfies UseQueryOptions<CurrentRuntime[]>;
      },
      reshim(toolName?: string, version?: string) {
        return {
          mutationKey: ['reshim', toolName, version],
          mutationFn: async () => {
            const args = ['reshim'];
            if (toolName) args.push(toolName);
            if (version) args.push(version);
            const command = new Command('asdf', args);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
        } satisfies UseMutationOptions<void>;
      },
      global(toolName: string, version = 'latest') {
        return {
          mutationKey: ['global', toolName, version],
          mutationFn: async () => {
            const args = ['global', toolName, version];
            const command = new Command('asdf', args);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries(api.asdf.runtime.list()),
              queryClient.invalidateQueries(api.asdf.runtime.current()),
            ]);
          },
        } satisfies UseMutationOptions<void>;
      },
      where(toolName: string, version?: string) {
        return {
          queryKey: ['where', toolName, version],
          queryFn: async () => {
            const args = ['where', toolName];
            if (version) args.push(version);
            const command = new Command('asdf', args);
            const { code, stderr, stdout } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            const homeDirectory = await queryClient.fetchQuery(api.homeDir());
            return parsePath(stdout, homeDirectory);
          },
        } satisfies UseQueryOptions<string[]>;
      },
      which(toolName: string) {
        return {
          queryKey: ['which', toolName],
          queryFn: async () => {
            const args = ['which', toolName];
            const command = new Command('asdf', args);
            const { code, stderr, stdout } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            const homeDirectory = await queryClient.fetchQuery(api.homeDir());
            return parsePath(stdout, homeDirectory);
          },
        } satisfies UseQueryOptions<string[]>;
      },
    },
    plugin: {
      list() {
        return {
          queryKey: ['plugin', 'list'],
          queryFn: async () => {
            const args = ['plugin', 'list', '--urls'];
            const command = new Command('asdf', args);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            return parsePluginList(stdout, true);
          },
        } satisfies UseQueryOptions<Plugin[]>;
      },
      listAll() {
        return {
          queryKey: ['plugin', 'list', 'all'],
          queryFn: async () => {
            const args = ['plugin', 'list', 'all'];
            const command = new Command('asdf', args);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            return parsePluginList(stdout);
          },
        } satisfies UseQueryOptions<Plugin[]>;
      },
    },
  },
  pwd() {
    return {
      queryKey: ['pwd'],
      queryFn: async () => {
        const command = new Command('pwd');
        const { stdout, code, stderr } = await command.execute();
        if (code !== 0) throw new CommandError(stderr, code);
        const homeDirectory = await queryClient.fetchQuery(api.homeDir());
        return parsePath(stdout, homeDirectory);
      },
    } satisfies UseQueryOptions<string[]>;
  },
  homeDir() {
    return {
      queryKey: ['homeDir'],
      queryFn: async () => {
        return await homeDir();
      },
    };
  },
};
