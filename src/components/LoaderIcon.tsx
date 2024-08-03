import { LoaderCircleIcon, type LucideProps } from 'lucide-react';

import { cn } from '~/utils';

export interface LoaderIconProps extends LucideProps {}

export const LoaderIcon: React.FC<LoaderIconProps> = (props) => {
  return <LoaderCircleIcon className={cn('animate-spin', props.className)} {...props} />;
};
