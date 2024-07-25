/* eslint-disable @tanstack/query/exhaustive-deps */
import { type UseMutationOptions, queryOptions } from '@tanstack/react-query';
import { BaseDirectory, exists, readTextFile, writeTextFile } from '@tauri-apps/api/fs';
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

function parseVersionsList(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .reverse();
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
    .filter((line) => line !== '' || line.includes('updating plugin repository'))
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

export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string>;
}

export const asdfProfileConfig = () => `export ASDF_DIR="$HOME/.asdf"\n. "$HOME/.asdf/asdf.sh"`;

export const cli = {
  asdf: {
    runtime: {
      help(options?: CommandOptions) {
        return queryOptions<string, CommandError>({
          queryKey: ['help', options].filter((v) => !!v),
          queryFn: async () => {
            const args = ['--help'];
            const command = new Command('asdf', args, options);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            return stdout;
          },
          retry: false,
        });
      },
      list(toolName?: string, options?: CommandOptions) {
        return queryOptions<Runtime[], CommandError>({
          queryKey: ['list', toolName, options].filter((v) => !!v),
          queryFn: async () => {
            const args = ['list'];
            if (toolName) args.push(toolName);
            const command = new Command('asdf', args, options);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            return parseRuntimesList(stdout, toolName);
          },
        });
      },
      listAll(toolName: string, options?: CommandOptions) {
        return queryOptions<string[], CommandError>({
          queryKey: ['list', 'all', toolName, options].filter((v) => !!v),
          queryFn: async () => {
            const args = ['list', 'all'];
            if (toolName) args.push(toolName);
            const command = new Command('asdf', args, options);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            return parseVersionsList(stdout);
          },
        });
      },
      current(toolName?: string, options?: CommandOptions) {
        return queryOptions<CurrentRuntime[], CommandError>({
          queryKey: ['current', toolName, options].filter((v) => !!v),
          queryFn: async () => {
            const args = ['current'];
            if (toolName) args.push(toolName);
            const command = new Command('asdf', args, options);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0 && code !== 126) throw new CommandError(stderr, code);
            const homeDirectory = await queryClient.fetchQuery(cli.homeDir());
            return parseCurrentRuntimeList(stdout, homeDirectory);
          },
        });
      },
      reshim(toolName?: string, version?: string, options?: CommandOptions) {
        return {
          mutationKey: ['reshim', toolName, version, options].filter((v) => !!v),
          mutationFn: async () => {
            const args = ['reshim'];
            if (toolName) args.push(toolName);
            if (version) args.push(version);
            const command = new Command('asdf', args, options);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
        } satisfies UseMutationOptions<void, CommandError>;
      },
      global() {
        return {
          mutationKey: ['global'].filter((v) => !!v),
          mutationFn: async ({ toolName, version, options }) => {
            const args = ['global', toolName, version];
            const command = new Command('asdf', args, options);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
          onSuccess: async (_, { toolName }) => {
            await Promise.all([
              queryClient.invalidateQueries(cli.asdf.runtime.list(toolName)),
              queryClient.invalidateQueries(cli.asdf.runtime.current(toolName)),
              queryClient.invalidateQueries(cli.asdf.runtime.where(toolName)),
            ]);
          },
        } satisfies UseMutationOptions<
          void,
          CommandError,
          { toolName: string; version: string; options?: CommandOptions }
        >;
      },
      where(toolName: string, version?: string, options?: CommandOptions) {
        return queryOptions<string[], CommandError>({
          queryKey: ['where', toolName, version, options].filter((v) => !!v),
          queryFn: async () => {
            const args = ['where', toolName];
            if (version) args.push(version);
            const command = new Command('asdf', args, options);
            const { code, stderr, stdout } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            const homeDirectory = await queryClient.fetchQuery(cli.homeDir());
            return parsePath(stdout, homeDirectory);
          },
        });
      },
      which(toolName: string, options?: CommandOptions) {
        return queryOptions<string[], CommandError>({
          queryKey: ['which', toolName, options].filter((v) => !!v),
          queryFn: async () => {
            const args = ['which', toolName];
            const command = new Command('asdf', args, options);
            const { code, stderr, stdout } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            const homeDirectory = await queryClient.fetchQuery(cli.homeDir());
            return parsePath(stdout, homeDirectory);
          },
        });
      },
      install() {
        return {
          mutationKey: ['install'].filter((v) => !!v),
          mutationFn: async ({ options, toolName, version }) => {
            const args = ['install'];
            if (toolName) args.push(toolName);
            if (version) args.push(version);
            const command = new Command('asdf', args, options);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
          onSuccess: async (_, { toolName }) => {
            await Promise.all([
              queryClient.invalidateQueries(cli.asdf.runtime.list()),
              queryClient.invalidateQueries(cli.asdf.runtime.current()),
            ]);
            if (toolName)
              await Promise.all([
                queryClient.invalidateQueries(cli.asdf.runtime.where(toolName)),
                queryClient.invalidateQueries(cli.asdf.runtime.which(toolName)),
              ]);
          },
        } satisfies UseMutationOptions<
          void,
          CommandError,
          { toolName?: string; version?: string; options?: CommandOptions }
        >;
      },
      uninstall() {
        return {
          mutationKey: ['uninstall'].filter((v) => !!v),
          mutationFn: async ({ options, toolName, version }) => {
            const args = ['uninstall'];
            if (toolName) args.push(toolName);
            if (version) args.push(version);
            const command = new Command('asdf', args, options);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
          onSuccess: async (_, { toolName }) => {
            await Promise.all([
              queryClient.invalidateQueries(cli.asdf.runtime.list()),
              queryClient.invalidateQueries(cli.asdf.runtime.current()),
            ]);
            if (toolName)
              await Promise.all([
                queryClient.invalidateQueries(cli.asdf.runtime.where(toolName)),
                queryClient.invalidateQueries(cli.asdf.runtime.which(toolName)),
              ]);
          },
        } satisfies UseMutationOptions<
          void,
          CommandError,
          { toolName: string; version?: string; options?: CommandOptions }
        >;
      },
    },
    plugin: {
      list(options?: CommandOptions) {
        return queryOptions<Plugin[], CommandError>({
          queryKey: ['plugin', 'list', options].filter((v) => !!v),
          queryFn: async () => {
            const args = ['plugin', 'list', '--urls'];
            const command = new Command('asdf', args, options);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            return parsePluginList(stdout, true);
          },
        });
      },
      listAll(options?: CommandOptions) {
        return queryOptions<Plugin[], CommandError>({
          queryKey: ['plugin', 'list', 'all', options].filter((v) => !!v),
          queryFn: async () => {
            const args = ['plugin', 'list', 'all'];
            const command = new Command('asdf', args, options);
            const { stdout, code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
            return parsePluginList(stdout);
          },
        });
      },
      add() {
        return {
          mutationKey: ['add'].filter((v) => !!v),
          mutationFn: async ({ options, toolName, url }) => {
            const args = ['plugin', 'add', toolName];
            if (url) args.push(url);
            const command = new Command('asdf', args, options);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries(cli.asdf.plugin.list()),
              queryClient.invalidateQueries(cli.asdf.plugin.listAll()),
            ]);
          },
        } satisfies UseMutationOptions<
          void,
          CommandError,
          { toolName: string; url?: string; options?: CommandOptions }
        >;
      },
      remove() {
        return {
          mutationKey: ['remove'].filter((v) => !!v),
          mutationFn: async ({ options, toolName }) => {
            const args = ['plugin', 'remove', toolName];
            const command = new Command('asdf', args, options);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
          onSuccess: async (_, { toolName }) => {
            await Promise.all([
              queryClient.invalidateQueries(cli.asdf.plugin.list()),
              queryClient.invalidateQueries(cli.asdf.plugin.listAll()),
              queryClient.invalidateQueries(cli.asdf.runtime.current()),
              queryClient.invalidateQueries(cli.asdf.runtime.list()),
              queryClient.invalidateQueries(cli.asdf.runtime.where(toolName)),
              queryClient.invalidateQueries(cli.asdf.runtime.which(toolName)),
            ]);
          },
        } satisfies UseMutationOptions<void, CommandError, { toolName: string; options?: CommandOptions }>;
      },
      update() {
        return {
          mutationKey: ['update'].filter((v) => !!v),
          mutationFn: async ({ options, toolName, gitRef }) => {
            const args = ['plugin', 'update', toolName];
            if (gitRef) args.push(gitRef);
            const command = new Command('asdf', args, options);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries(cli.asdf.plugin.list()),
              queryClient.invalidateQueries(cli.asdf.plugin.listAll()),
            ]);
          },
        } satisfies UseMutationOptions<
          void,
          CommandError,
          { toolName: string; gitRef?: string; options?: CommandOptions }
        >;
      },
      updateAll() {
        return {
          mutationKey: ['updateAll'].filter((v) => !!v),
          mutationFn: async ({ options }) => {
            const args = ['plugin', 'update', '--all'];
            const command = new Command('asdf', args, options);
            const { code, stderr } = await command.execute();
            if (code !== 0) throw new CommandError(stderr, code);
          },
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries(cli.asdf.plugin.list()),
              queryClient.invalidateQueries(cli.asdf.plugin.listAll()),
            ]);
          },
        } satisfies UseMutationOptions<void, CommandError, { options?: CommandOptions }>;
      },
    },
  },
  pwd(options?: CommandOptions) {
    return queryOptions<string[], CommandError>({
      queryKey: ['pwd', options].filter((v) => !!v),
      queryFn: async () => {
        const command = new Command('pwd', '', options);
        const { stdout, code, stderr } = await command.execute();
        if (code !== 0) throw new CommandError(stderr, code);
        const homeDirectory = await queryClient.fetchQuery(cli.homeDir());
        return parsePath(stdout, homeDirectory);
      },
    });
  },
  homeDir() {
    return queryOptions<string, CommandError>({
      queryKey: ['homeDir'],
      queryFn: async () => {
        return await homeDir();
      },
    });
  },
  git: {
    help(options?: CommandOptions) {
      return queryOptions<string, CommandError>({
        queryKey: ['git', 'help', options].filter((v) => !!v),
        queryFn: async () => {
          const args = ['--help'];
          const command = new Command('git', args, options);
          const { stdout, code, stderr } = await command.execute();
          if (code !== 0) throw new CommandError(stderr, code);
          return stdout;
        },
      });
    },
  },
  curl: {
    help(options?: CommandOptions) {
      return queryOptions<string, CommandError>({
        queryKey: ['curl', 'help', options].filter((v) => !!v),
        queryFn: async () => {
          const args = ['--help'];
          const command = new Command('curl', args, options);
          const { stdout, code, stderr } = await command.execute();
          if (code !== 0) throw new CommandError(stderr, code);
          return stdout;
        },
      });
    },
  },
  downloadAsdf() {
    return {
      mutationKey: ['downloadAsdf'].filter((v) => !!v),
      mutationFn: async () => {
        const homeDir = await queryClient.fetchQuery(cli.homeDir());
        const args = ['clone', 'https://github.com/asdf-vm/asdf.git', `${homeDir}/.asdf`, '--branch', 'v0.14.0'];
        const command = new Command('git', args);
        const { code, stderr } = await command.execute();
        if (code !== 0) throw new CommandError(stderr, code);
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(cli.asdf.runtime.help()),
          queryClient.invalidateQueries(cli.asdf.runtime.list()),
          queryClient.invalidateQueries(cli.asdf.runtime.current()),
        ]);
      },
    } satisfies UseMutationOptions<void, CommandError>;
  },
  addAsdfToProfile() {
    return {
      mutationKey: ['addAsdfToProfile'].filter((v) => !!v),
      mutationFn: async () => {
        const profileFileName = '.profile';
        const profileExists = await exists(profileFileName, { dir: BaseDirectory.Home });
        let profileData = '';
        if (profileExists)
          profileData = await readTextFile(profileFileName, { dir: BaseDirectory.Home }).catch(() => '');
        profileData = profileData.replace(/\n\n# DXUP_CONFIG_START[\s\S]*# DXUP_CONFIG_END\n/g, '');
        const newProfileData =
          profileData + '\n\n# DXUP_CONFIG_START\n' + asdfProfileConfig() + '\n# DXUP_CONFIG_END\n';
        const error = await writeTextFile(profileFileName, newProfileData, { dir: BaseDirectory.Home }).catch(
          (e: unknown) => e,
        );
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
        if (error) throw new CommandError(`Failed to write to profile file ${error}`, 1);
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(cli.asdf.runtime.help()),
          queryClient.invalidateQueries(cli.asdf.runtime.list()),
          queryClient.invalidateQueries(cli.asdf.runtime.current()),
        ]);
      },
    } satisfies UseMutationOptions<void, CommandError>;
  },
};
