import type { Assign } from '@ark-ui/react';
import { Progress as ArkProgress, type ProgressRootProps } from '@ark-ui/react/progress';
import { forwardRef } from 'react';
import { splitCssProps } from 'styled-system/jsx';
import { type ProgressVariantProps, progress } from 'styled-system/recipes';
import type { JsxStyleProps } from 'styled-system/types';

import { css, cx } from 'styled-system/css';

export interface ProgressProps extends Assign<JsxStyleProps, ProgressRootProps>, ProgressVariantProps {
  /**
   * The type of progress to render.
   * @default linear
   */
  type?: 'linear' | 'circular';
  /**
   * Should the text be shown?
   * @default false
   */
  text?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>((props, ref) => {
  const [variantProps, progressProps] = progress.splitVariantProps(props);
  const [cssProps, localProps] = splitCssProps(progressProps);
  const { children, className, type = 'linear', ...rootProps } = localProps;
  const styles = progress(variantProps);

  return (
    <ArkProgress.Root ref={ref} className={cx(styles.root, css(cssProps), className)} {...rootProps}>
      {children && <ArkProgress.Label className={styles.label}>{children}</ArkProgress.Label>}
      {type === 'linear' && (
        <ArkProgress.Track className={styles.track}>
          <ArkProgress.Range className={styles.range} />
        </ArkProgress.Track>
      )}
      {type === 'circular' && (
        <ArkProgress.Circle className={styles.circle}>
          <ArkProgress.CircleTrack className={styles.circleTrack} />
          <ArkProgress.CircleRange className={styles.circleRange} />
          <ArkProgress.ValueText className={styles.valueText} />
        </ArkProgress.Circle>
      )}
      {!!props.text && <ArkProgress.ValueText className={styles.valueText} />}
    </ArkProgress.Root>
  );
});

Progress.displayName = 'Progress';
