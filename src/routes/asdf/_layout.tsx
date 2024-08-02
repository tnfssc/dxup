import { Outlet, createFileRoute } from '@tanstack/react-router';

import { cn } from '~/utils';

export const Route = createFileRoute('/asdf/_layout')({
  component: Layout,
});

function Layout() {
  return (
    <div className={cn('w-screen h-screen overflow-auto scroll-smooth prose')}>
      <Outlet />
    </div>
  );
}
