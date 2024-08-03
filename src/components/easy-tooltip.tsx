import { Tooltip, TooltipContent, TooltipTrigger } from '~/shadcn/tooltip';

export interface EasyTooltipProps {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  asChild?: boolean;
}

export const EasyTooltip: React.FC<EasyTooltipProps> = ({ tooltip, children, asChild = true }) => {
  return (
    <Tooltip>
      <TooltipTrigger aria-label={tooltip?.toString()} asChild={asChild}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};
