import { useMemo } from 'react';

import { ToastProvider, useToast } from '~/hooks/toaster';
import { PersistQueryClientProvider, asyncStoragePersister, createQueryClient } from '~/lib/query-client';

function QueryClientProvider({ children }: React.PropsWithChildren) {
  const toast = useToast();
  const queryClient = useMemo(() => createQueryClient(toast), [toast]);
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      {children}
    </PersistQueryClientProvider>
  );
}

export default function Providers({ children }: React.PropsWithChildren) {
  return (
    <ToastProvider>
      <QueryClientProvider>{children}</QueryClientProvider>
    </ToastProvider>
  );
}
