/* eslint-disable @tanstack/query/exhaustive-deps */
import { type UseMutationOptions, queryOptions } from '@tanstack/react-query';
import { type OpenDialogOptions, open } from '@tauri-apps/api/dialog';
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
};
