import { QueryClient } from '@tanstack/react-query';

import type { useToast } from '~/hooks/toaster';

export let queryClient: QueryClient;

export function createQueryClient(toast: ReturnType<typeof useToast>) {
  const qc = new QueryClient({
    defaultOptions: {
      mutations: {
        onError(error, variables, context) {
          console.error({ variables, context });
          console.error(error);
          if (error.message)
            toast.error({ title: 'Error', description: error.message.slice(-100) || 'Something went wrong!' });
          else toast.error({ title: 'Error', description: 'Something went wrong!' });
        },
      },
    },
  });
  queryClient = qc;
  return qc;
}
