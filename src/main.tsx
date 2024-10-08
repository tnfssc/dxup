import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '~/tailwind.css';

import '~/fonts';
import Providers from '~/providers';
import { routeTree } from '~/routeTree.gen';
import { Toaster } from '~/shadcn/sonner';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

declare global {
  // eslint-disable-next-line no-var
  function wait(time: number): Promise<void>;
  interface Window {
    wait: typeof wait;
  }
}

globalThis.wait = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
