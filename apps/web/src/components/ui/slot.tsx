'use client';

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type MutableRefObject,
  type ReactElement,
  type Ref,
} from 'react';
import { cn } from '@/lib/utils';

type UnknownProps = Record<string, unknown>;

function composeRefs<T>(...refs: Array<Ref<T> | undefined>): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  };
}

/** Merge slot props onto the child: compose handlers, merge className/style, child wins otherwise. */
function mergeProps(slotProps: UnknownProps, childProps: UnknownProps): UnknownProps {
  const merged: UnknownProps = { ...slotProps };
  for (const key of Object.keys(childProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof slotValue === 'function' && typeof childValue === 'function') {
      merged[key] = (...args: unknown[]) => {
        (childValue as (...a: unknown[]) => void)(...args);
        (slotValue as (...a: unknown[]) => void)(...args);
      };
    } else if (key === 'className') {
      merged[key] = cn(slotValue as string | undefined, childValue as string | undefined);
    } else if (key === 'style') {
      merged[key] = { ...(slotValue as CSSProperties), ...(childValue as CSSProperties) };
    } else {
      merged[key] = childValue;
    }
  }
  return merged;
}

export type SlotProps = HTMLAttributes<HTMLElement>;

/**
 * Minimal Radix-style Slot: instead of rendering its own DOM node, it merges its
 * props onto a single child element. Powers `asChild` on components like Button,
 * letting them render as e.g. a Next.js <Link> while keeping their styling.
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot({ children, ...slotProps }, ref) {
  if (!isValidElement(children)) return null;

  const child = children as ReactElement<UnknownProps> & { ref?: Ref<unknown> };
  const merged = mergeProps(slotProps as UnknownProps, child.props);
  merged.ref = composeRefs(ref, child.ref);

  return cloneElement(child, merged);
});
