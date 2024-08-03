import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/asdf/_layout/')({
  component: Page,
});

function Page() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-secondary-foreground">Please select a tool from the sidebar</p>
    </div>
  );
}
