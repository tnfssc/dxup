import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { cli } from '~/api';

export const Route = createFileRoute('/asdf/_layout/playground')({
  component: Page,
});

function Page() {
  const allPlugins = useQuery({ ...cli.asdf.plugin.listAll(), queryKey: [25] });

  return (
    <div>
      <pre>{JSON.stringify(allPlugins.data, null, 2)}</pre>
    </div>
  );
}
