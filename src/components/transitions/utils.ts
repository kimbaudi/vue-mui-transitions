import type * as CSS from "csstype";

export const reflow = (node: Element) => node.scrollTop;

interface CSSProperties extends CSS.Properties<string | number> {
  /**
   * The index signature was removed to enable closed typing for style
   * using CSSType. You're able to use type assertion or module augmentation
   * to add properties or an index signature of your own.
   *
   * For examples and more information, visit:
   * https://github.com/frenic/csstype#what-should-i-do-when-i-get-type-errors
   */
}

interface ComponentProps {
  // easing: string | { enter?: string; exit?: string } | undefined;
  // easing: { easeInOut: string; easeOut: string; easeIn: string; sharp: string };
  easing:
    | string
    | {
        easeInOut?: string;
        easeOut?: string;
        easeIn?: string;
        sharp?: string;
        enter?: string;
        exit?: string;
      }
    | undefined;
  style: CSSProperties | undefined;
  timeout: "auto" | number | { enter?: number; exit?: number };
}

interface Options {
  mode: "enter" | "exit";
}

interface TransitionProps {
  duration: string | number;
  easing: string | undefined;
  delay: string | undefined;
}

export function getTransitionProps(
  props: ComponentProps,
  options: Options,
): TransitionProps {
  const { timeout, easing, style = {} } = props;

  return {
    duration:
      style.transitionDuration ??
      (typeof timeout === "number" || timeout === "auto"
        ? timeout
        : timeout[options.mode] || 0),
    easing:
      style.transitionTimingFunction ??
      (typeof easing === "object" ? easing[options.mode] : easing),
    delay: style.transitionDelay,
  };
}
