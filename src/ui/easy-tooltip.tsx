import * as Tooltip from '~/ui/tooltip';

export interface EasyTooltipProps extends Tooltip.RootProps {
  children: React.ReactNode;
  tooltip: React.ReactNode;
  tooltipContentProps?: Tooltip.ContentProps;
}

export const EasyTooltip = ({ children, tooltip, tooltipContentProps, ...props }: EasyTooltipProps) => {
  if (!tooltip) return <>{children}</>;
  return (
    <Tooltip.Root {...props}>
      <Tooltip.Trigger asChild>
        <span>{children}</span>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Arrow>
          <Tooltip.ArrowTip />
        </Tooltip.Arrow>
        <Tooltip.Content css={{ fontFamily: 'body', fontWeight: 'medium' }} {...tooltipContentProps}>
          {tooltip}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
};
