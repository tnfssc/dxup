import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: Page,
});

function Page() {
  const router = useRouter();
  useEffect(() => {
    void router.navigate({ to: '/asdf' });
  }, [router]);

  return <></>;
}
