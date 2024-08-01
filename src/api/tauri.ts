/* eslint-disable @tanstack/query/exhaustive-deps */
import { type UseMutationOptions, queryOptions } from '@tanstack/react-query';
import { type OpenDialogOptions, open } from '@tauri-apps/api/dialog';
import { exists, readTextFile, writeTextFile } from '@tauri-apps/api/fs';
import { normalize } from '@tauri-apps/api/path';

import { queryClient } from '~/lib/query-client';

import { cli } from './cli';

export const tauri = {
  dialog: {
    open(defaultOptions?: OpenDialogOptions) {
      return {
        mutationKey: ['open', defaultOptions].filter((v) => !!v),
        mutationFn: async ({ options: _options }: { options?: OpenDialogOptions }) => {
          const options = { ...defaultOptions, ..._options };
          let dir: string | null = null;
          const selected = await open(options);
          if (Array.isArray(selected)) dir = selected[0];
          else dir = selected;
          if (!dir) throw new Error('No directory selected');
          return dir;
        },
      } satisfies UseMutationOptions<string, Error, { options?: OpenDialogOptions }>;
    },
  },
  path: {
    normalize(path: string) {
      return queryOptions({
        queryKey: ['path', 'normalize', path].filter((v) => !!v),
        queryFn: async () => {
          let p = await normalize(path);
          const homeDirectory = await queryClient.fetchQuery(cli.homeDir());
          if (p.includes(homeDirectory)) p = p.replace(homeDirectory, '~/');
          return p;
        },
      });
    },
  },
  fs: {
    exists(path: string) {
      return queryOptions({
        queryKey: ['fs', 'exists', path].filter((v) => !!v),
        queryFn: async () => {
          return await exists(path);
        },
      });
    },
    readTextFile(path: string) {
      return queryOptions({
        queryKey: ['fs', 'readTextFile', path].filter((v) => !!v),
        queryFn: async () => {
          const exists = await queryClient.fetchQuery(tauri.fs.exists(path));
          if (!exists) throw new Error('File does not exist');
          return await readTextFile(path);
        },
      });
    },
    writeTextFile(path: string, data: string) {
      return queryOptions({
        queryKey: ['fs', 'writeTextFile', path].filter((v) => !!v),
        queryFn: async () => {
          return await writeTextFile(path, data);
        },
      });
    },
  },
};
