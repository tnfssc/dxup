import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { AsyncStorage } from '@tanstack/query-persist-client-core';
import { QueryClient } from '@tanstack/react-query';

import type { useToast } from '~/shadcn/use-toast';
import { cache } from '~/stores/cache';

export let queryClient: QueryClient;

export function createQueryClient(toast: ReturnType<typeof useToast>['toast']): QueryClient {
  const qc = new QueryClient({
    defaultOptions: {
      mutations: {
        onError(error, variables, context) {
          console.error({ variables, context });
          console.error(error);
          if (error.message)
            toast({
              title: 'Error',
              description: error.message.slice(-100) || 'Something went wrong!',
              variant: 'destructive',
            });
          else toast({ title: 'Error', description: 'Something went wrong!', variant: 'destructive' });
        },
      },
    },
  });
  queryClient = qc;
  return qc;
}

class Storage implements AsyncStorage {
  getItem(key: string) {
    return cache.get<string>(key);
  }
  async setItem(key: string, value: string) {
    await cache.set(key, value);
    await cache.save();
  }
  async removeItem(key: string) {
    await cache.delete(key);
  }
}

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: new Storage(),
  throttleTime: 1000,
});

export { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
