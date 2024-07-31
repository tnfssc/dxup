import { Box, type BoxProps } from 'styled-system/jsx';

import { IconButton, type IconButtonProps } from '~/ui/icon-button';

export interface FloatingActionButtonProps extends IconButtonProps {
  containerProps?: BoxProps;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ containerProps, ...props }) => {
  return (
    <Box pos="absolute" top="2" left="2" {...containerProps}>
      {/* @ts-expect-error - TODO: fix */}
      <IconButton {...props} />
    </Box>
  );
};
