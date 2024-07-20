import { QueryClientProvider as ReactQueryProvider } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ToastProvider, useToast } from '~/hooks/toaster';
import { createQueryClient } from '~/lib/query-client';

function QueryClientProvider({ children }: React.PropsWithChildren) {
  const toast = useToast();
  const queryClient = useMemo(() => createQueryClient(toast), [toast]);
  return <ReactQueryProvider client={queryClient}>{children}</ReactQueryProvider>;
}

export default function Providers({ children }: React.PropsWithChildren) {
  return (
    <ToastProvider>
      <QueryClientProvider>{children}</QueryClientProvider>
    </ToastProvider>
  );
}
