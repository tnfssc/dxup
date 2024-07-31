import { createFileRoute } from '@tanstack/react-router';
import { open } from '@tauri-apps/api/shell';
import { Center, VStack } from 'styled-system/jsx';

import { Text } from '~/ui/text';

export const Route = createFileRoute('/tools/_layout/about')({
  component: Page,
});

function Page() {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    void open(e.currentTarget.href);
  };

  return (
    <Center minH="screen">
      <VStack>
        <Text colorPalette="gray">
          This tool was created by{' '}
          <a href="https://sharath.uk" onClick={handleLinkClick} className="hover:underline">
            sharath.uk
          </a>
        </Text>
        <Text colorPalette="gray">
          Visit official landing page at{' '}
          <a href="https://sharath.uk/dxup" onClick={handleLinkClick} className="hover:underline">
            sharath.uk/dxup
          </a>
        </Text>
      </VStack>
    </Center>
  );
}
