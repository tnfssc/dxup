import { useStore } from '@nanostores/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { tauri } from '~/api';
import { $project } from '~/stores/project';

export const Route = createFileRoute('/tools/_layout/playground')({
  component: Page,
});

function Page() {
  const project = useStore($project);
  const toolVersionQuery = useQuery(tauri.fs.readTextFile(`${project}/.tool-versions`));

  return (
    <div>
      <pre>{toolVersionQuery.data}</pre>
    </div>
  );
}
