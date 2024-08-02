import { useMemo } from 'react';

import { PersistQueryClientProvider, asyncStoragePersister, createQueryClient } from '~/lib/query-client';
import { useToast } from '~/shadcn/use-toast';

function QueryClientProvider({ children }: React.PropsWithChildren) {
  const { toast } = useToast();
  const queryClient = useMemo(() => createQueryClient(toast), [toast]);
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      {children}
    </PersistQueryClientProvider>
  );
}

export default function Providers({ children }: React.PropsWithChildren) {
  return <QueryClientProvider>{children}</QueryClientProvider>;
}
