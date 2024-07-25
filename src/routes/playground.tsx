import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { cli } from '~/api';

export const Route = createFileRoute('/playground')({
  component: Page,
});

function Page() {
  const gitQuery = useQuery(cli.git.help());
  const curlQuery = useQuery(cli.curl.help());

  return (
    <div>
      <pre>
        {gitQuery.data}
        {curlQuery.data}
      </pre>
    </div>
  );
}
