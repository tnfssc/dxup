import {
  type ElementType,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type RefAttributes,
  createContext,
  forwardRef,
  useContext,
} from 'react';
import { styled } from 'styled-system/jsx';

import { cx } from 'styled-system/css';

type Props = Record<string, unknown>;
interface Recipe {
  (props?: Props): Props;
  splitVariantProps: (props: Props) => [Props, Props];
}
type Slot<R extends Recipe> = keyof ReturnType<R>;

export const createStyleContext = <R extends Recipe>(recipe: R) => {
  const StyleContext = createContext<Record<Slot<R>, string> | null>(null);

  const withRootProvider = <P extends NonNullable<unknown>>(Component: ElementType) => {
    const StyledComponent = (props: P) => {
      const [variantProps, otherProps] = recipe.splitVariantProps(props);
      const slotStyles = recipe(variantProps) as Record<Slot<R>, string>;

      return (
        <StyleContext.Provider value={slotStyles}>
          <Component {...otherProps} />
        </StyleContext.Provider>
      );
    };
    return StyledComponent;
  };

  const withProvider = <T, P extends { className?: string }>(
    Component: ElementType,
    slot: Slot<R>,
  ): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> => {
    const StyledComponent = styled(Component);
    const Comp = forwardRef<T, P>((props, ref) => {
      const [variantProps, otherProps] = recipe.splitVariantProps(props);
      const slotStyles = recipe(variantProps) as Record<Slot<R>, string>;

      return (
        <StyleContext.Provider value={slotStyles}>
          <StyledComponent {...otherProps} ref={ref} className={cx(slotStyles[slot], props.className)} />
        </StyleContext.Provider>
      );
    });
    Comp.displayName = `StyleProvider`;
    return Comp;
  };

  const withContext = <T, P extends { className?: string }>(
    Component: ElementType,
    slot: Slot<R>,
  ): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> => {
    const StyledComponent = styled(Component);
    const Comp = forwardRef<T, P>((props, ref) => {
      const slotStyles = useContext(StyleContext);
      return <StyledComponent {...props} ref={ref} className={cx(slotStyles?.[slot], props.className)} />;
    });
    Comp.displayName = `StyleContext`;
    return Comp;
  };

  return {
    withRootProvider,
    withProvider,
    withContext,
  };
};
