import { MenuIcon, XIcon } from 'lucide-react';
import { css } from 'styled-system/css';

import { Code } from '~/ui/code';
import * as Drawer from '~/ui/drawer';
import { IconButton } from '~/ui/icon-button';

export interface NavDrawerProps extends Drawer.RootProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerContent?: React.ReactNode;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({ children, title, subtitle, footerContent, ...props }) => {
  return (
    <Drawer.Root variant="right" {...props}>
      <Drawer.Trigger asChild>
        <IconButton aria-label="Drawer" variant="ghost">
          <MenuIcon />
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{title}</Drawer.Title>
            <Drawer.Description>
              <Code css={{ maxW: 'xs' }}>
                <span className={css({ textOverflow: 'ellipsis', overflow: 'hidden' })}>{subtitle}</span>
              </Code>
            </Drawer.Description>
            <Drawer.CloseTrigger asChild position="absolute" top="3" right="4">
              <IconButton variant="ghost">
                <XIcon />
              </IconButton>
            </Drawer.CloseTrigger>
          </Drawer.Header>
          <Drawer.Body>{children}</Drawer.Body>
          <Drawer.Footer gap="3">{footerContent}</Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};
