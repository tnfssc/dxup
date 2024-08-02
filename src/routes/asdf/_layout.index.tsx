import { createFileRoute } from '@tanstack/react-router';

import { Button } from '~/shadcn/button';

export const Route = createFileRoute('/asdf/_layout/')({
  component: Page,
});

function Page() {
  return (
    <div>
      <Button>ShadCN button</Button>
    </div>
  );
}
