import { QueryClient, QueryClientProvider as ReactQueryProvider } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ToastProvider, useToast } from '~/hooks/toaster';

function QueryClientProvider({ children }: React.PropsWithChildren) {
  const toast = useToast();
  const queryClient = useMemo(
    () =>
      new QueryClient({
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
              toast.error({ title: 'Error', description: error.message });
            },
          },
        },
      }),
    [toast],
  );
  return <ReactQueryProvider client={queryClient}>{children}</ReactQueryProvider>;
}

export default function Providers({ children }: React.PropsWithChildren) {
  return (
    <ToastProvider>
      <QueryClientProvider>{children}</QueryClientProvider>
    </ToastProvider>
  );
}
