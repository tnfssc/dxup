import type { Assign, HTMLArkProps } from '@ark-ui/react';
import React from 'react';
import { splitCssProps } from 'styled-system/jsx';
import { type TextVariantProps, text } from 'styled-system/recipes';
import type { JsxStyleProps } from 'styled-system/types';

import { css, cx } from 'styled-system/css';

type PolymorphicRef<C extends React.ElementType> = React.ComponentPropsWithRef<C>['ref'];

interface AsProp<C extends React.ElementType> {
  as?: C;
}

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<C extends React.ElementType, Props = object> = React.PropsWithChildren<
  Props & AsProp<C>
> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

type PolymorphicComponentPropWithRef<C extends React.ElementType, Props = object> = PolymorphicComponentProp<
  C,
  Props
> & {
  ref?: PolymorphicRef<C>;
};

export type TextProps<C extends React.ElementType> = PolymorphicComponentPropWithRef<
  C,
  Assign<JsxStyleProps, HTMLArkProps<'p'>> & TextVariantProps
>;

type PolymorphicComponent = <C extends React.ElementType = 'p'>(props: TextProps<C>) => React.ReactNode | null;

export const Text: PolymorphicComponent = React.forwardRef(
  <C extends React.ElementType = 'p'>(props: TextProps<C>, ref?: PolymorphicRef<C>) => {
    const [variantProps, textProps] = text.splitVariantProps(props);
    const [cssProps, localProps] = splitCssProps(textProps);
    const { className, as: _as, ...otherProps } = localProps;
    const styles = text(variantProps);
    const Component = props.as ?? 'p';

    return <Component ref={ref} className={cx(styles, css(cssProps), className)} {...otherProps} />;
  },
);

// @ts-expect-error - This is a hack to get the display name to show up in the docs
Text.displayName = 'Text';
