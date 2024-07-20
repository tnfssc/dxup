import { QueryClient } from '@tanstack/react-query';

import type { useToast } from '~/hooks/toaster';

export let queryClient: QueryClient;

export function createQueryClient(toast: ReturnType<typeof useToast>) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        refetchInterval: false,
        retryOnMount: false,
      },
      mutations: {
        retry: false,
        onError(error, variables, context) {
          console.error({ variables, context });
          console.error(error);
          toast.error({ title: 'Error', description: error.message || 'Something went wrong!' });
        },
      },
    },
  });
  queryClient = qc;
  return qc;
}
