import { createFileRoute } from '@tanstack/react-router';
import { Center } from 'styled-system/jsx';

import { Text } from '~/ui/text';

export const Route = createFileRoute('/tools/_layout/')({
  component: Page,
});

function Page() {
  return (
    <Center minH="screen">
      <Text colorPalette="gray">Please select a tool from the sidebar</Text>
    </Center>
  );
}
