import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { tauri } from '~/api';

export const Route = createFileRoute('/asdf/_layout/playground')({
  component: Page,
});

function Page() {
  const appDataDir = useQuery(tauri.path.appDataDir());

  return (
    <div>
      <pre>{appDataDir.data}</pre>
    </div>
  );
}
