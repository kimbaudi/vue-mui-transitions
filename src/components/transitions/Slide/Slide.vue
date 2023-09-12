<!-- eslint-disable vue/multi-word-component-names -->
<script lang="ts">
import type * as CSS from "csstype";
import { onMounted, onUnmounted, ref, watch } from "vue";
import debounce from "../debounce";
import { reflow, getTransitionProps } from "../utils";
import createTransitions from "../createTransitions";
import ownerWindow from "../ownerWindow";

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

type Direction = "down" | "left" | "right" | "up";

// Translate the node so it can't be seen on the screen.
// Later, we're going to translate the node back to its original location with `none`.
function getTranslateValue(
  direction: Direction,
  node: Element,
  resolvedContainer: Element,
) {
  const rect = node.getBoundingClientRect();
  const containerRect =
    resolvedContainer && resolvedContainer.getBoundingClientRect();
  const containerWindow = ownerWindow(node);
  let transform;

  // if (node.fakeTransform) {
  //   transform = node.fakeTransform;
  // } else {
  const computedStyle = containerWindow.getComputedStyle(node);
  transform =
    computedStyle.getPropertyValue("-webkit-transform") ||
    computedStyle.getPropertyValue("transform");
  // }

  let offsetX = 0;
  let offsetY = 0;

  if (transform && transform !== "none" && typeof transform === "string") {
    const transformValues = transform.split("(")[1].split(")")[0].split(",");
    offsetX = parseInt(transformValues[4], 10);
    offsetY = parseInt(transformValues[5], 10);
  }

  if (direction === "left") {
    if (containerRect) {
      return `translateX(${containerRect.right + offsetX - rect.left}px)`;
    }

    return `translateX(${containerWindow.innerWidth + offsetX - rect.left}px)`;
  }

  if (direction === "right") {
    if (containerRect) {
      return `translateX(-${rect.right - containerRect.left - offsetX}px)`;
    }

    return `translateX(-${rect.left + rect.width - offsetX}px)`;
  }

  if (direction === "up") {
    if (containerRect) {
      return `translateY(${containerRect.bottom + offsetY - rect.top}px)`;
    }
    return `translateY(${containerWindow.innerHeight + offsetY - rect.top}px)`;
  }

  // direction === 'down'
  if (containerRect) {
    return `translateY(-${
      rect.top - containerRect.top + rect.height - offsetY
    }px)`;
  }
  return `translateY(-${rect.top + rect.height - offsetY}px)`;
}

function resolveContainer(containerPropProp: Function | undefined) {
  return typeof containerPropProp === "function"
    ? containerPropProp()
    : containerPropProp;
}

function setTranslateValue(
  direction: Direction,
  node: Element,
  containerProp: Function | undefined,
) {
  const resolvedContainer = resolveContainer(containerProp);
  const transform = getTranslateValue(direction, node, resolvedContainer);

  if (transform) {
    (node as HTMLElement).style.webkitTransform = transform;
    (node as HTMLElement).style.transform = transform;
  }
}

// eslint-disable-next-line vue/no-dupe-keys
const { create, duration, easing } = createTransitions({});

const defaultEasing = {
  enter: easing.easeOut,
  exit: easing.sharp,
};

const defaultTimeout = {
  enter: duration.enteringScreen,
  exit: duration.leavingScreen,
};

export type Props = {
  name: string;
  appear: boolean;
  container: Function;
  direction: Direction;
  easing:
    | string
    | {
        enter: string;
        exit: string;
        // easeInOut: string;
        // easeOut: string;
        // easeIn: string;
        // sharp: string;
      };
  in: boolean;
  style: CSSProperties | undefined;
  // timeout: { appear: number, enter: number, exit: number } | number,
  // timeout: { enter: number, exit: number },
  timeout:
    | number
    | {
        enter: number;
        exit: number;
      };
};

// const def = {
//   name: {
//     type: String,
//     required: false,
//     default: "slide",
//   },
//   appear: {
//     type: Boolean,
//     required: false,
//     default: true,
//   },
//   // container: {
//   //   type: HTMLDivElement,
//   //   required: false,
//   //   default: undefined,
//   // },
//   container: {
//     type: Function,
//     required: false,
//     default: () => undefined,
//   },
//   direction: {
//     type: String,
//     required: false,
//     default: "down",
//     validator: (value: string) => {
//       return ["up", "down", "left", "right"].includes(value);
//     },
//   },
//   easing: {
//     type: [String, Object],
//     required: false,
//     default: () => defaultEasing,
//   },
//   in: {
//     type: Boolean,
//     required: false,
//     default: false,
//   },
//   style: {
//     type: Object,
//     required: false,
//     default: () => ({}),
//   },
//   timeout: {
//     type: [Number, Object],
//     required: false,
//     default: () => defaultTimeout,
//   },
// };
</script>

<script setup lang="ts">
const emits = defineEmits([
  "before-enter",
  "enter",
  "after-enter",
  "enter-cancelled",
  "before-leave",
  "leave",
  "after-leave",
  "leave-cancelled",
]);

const props = withDefaults(defineProps<Props>(), {
  name: "slide",
  appear: true,
  container: () => undefined,
  direction: "down",
  easing: () => defaultEasing,
  in: false,
  style: () => ({}),
  timeout: () => defaultTimeout,
});

// const props = defineProps(def);

const state = ref(props.in ? "ENTERED" : "EXITED");
const rootRef = ref<HTMLElement | null>(null);

// const handleResize = ref();
// const containerWindow = ref();
let handleResize: {
  (...args: any[]): void;
  clear(): void;
};
let containerWindow: Window & typeof globalThis;

onMounted(() => {
  // console.log("onMounted", state.value);
  if (rootRef.value) {
    rootRef.value.style.removeProperty("display");

    // console.log(rootRef.value.parentNode);
  }

  // eslint-disable-next-line prefer-destructuring
  const direction = props.direction;
  const inProp = props.in;
  if (!props.container) {
    return;
  }
  const containerProp = props.container();
  // console.log("direction", direction);
  // console.log("inProp", inProp);
  // console.log("containerProp", containerProp);

  if (!inProp && direction !== "down" && direction !== "right") {
    handleResize = debounce(() => {
      if (rootRef.value) {
        setTranslateValue(direction as Direction, rootRef.value, containerProp);
      }
    });
    if (rootRef.value) {
      containerWindow = ownerWindow(rootRef.value);
    }
    containerWindow.addEventListener("resize", handleResize);
  }
});

onUnmounted(() => {
  handleResize?.clear();
  containerWindow?.removeEventListener("resize", handleResize);
});

watch(
  [() => props.direction, () => props.in, () => props.container],
  (
    [
      direction,
      ,
      container,
    ] /* , [prevDirectionProp, prevInProp, prevContainerProp] */,
  ) => {
    // console.log("watch");
    // console.log("direction", direction);
    // console.log("inProp", inProp);
    // console.log("containerProp", container());
    if (rootRef.value && container) {
      setTranslateValue(direction as Direction, rootRef.value, container());
    }
    // if (!props.in) {
    //   console.log("props not in");
    // } else {
    //   console.log("props is in");
    // }
  },
  { immediate: false },
);

// handleEnter
function onBeforeEnter(el: Element) {
  // console.log("before enter");

  // setTranslateValue(props.direction, el, props.container);
  // reflow(el);

  // const transitionProps = getTransitionProps(
  //   { style: props.style, timeout: props.timeout, easing },
  //   {
  //     mode: "enter",
  //   }
  // );

  // el.style.webkitTransition = create("-webkit-transform", {
  //   ...transitionProps,
  // });

  // el.style.transition = create("transform", {
  //   ...transitionProps,
  // });

  // Emit the event to the parent
  emits("before-enter", el);
}

// handleEntering
function onEnter(el: Element, done: () => void) {
  // console.log("entering");
  state.value = "ENTERING";

  setTranslateValue(props.direction as Direction, el, props.container);
  reflow(el);

  const transitionProps = getTransitionProps(
    { style: props.style, timeout: props.timeout, easing },
    {
      mode: "enter",
    },
  );

  (el as HTMLElement).style.webkitTransition = create(
    "-webkit-transform",
    transitionProps,
  );

  (el as HTMLElement).style.transition = create("transform", transitionProps);

  (el as HTMLElement).style.webkitTransform = "none";
  (el as HTMLElement).style.transform = "none";

  // Emit the event to the parent
  emits("enter", el, done);

  // Call done() when the transition ends
  // to trigger the @after-enter event.
  setTimeout(
    done,
    (props.timeout as unknown as { enter: number }).enter ||
      (props.timeout as number),
  );
}

// handleEntered
function onAfterEnter(el: Element) {
  // console.log("entered");
  state.value = "ENTERED";

  // Emit the event to the parent
  emits("after-enter", el);
}

function onEnterCancelled(el: Element) {
  // console.log("enter cancelled");

  // Emit the event to the parent
  emits("enter-cancelled", el);
}

//  handleExit
function onBeforeLeave(el: Element) {
  // console.log("before exit");

  // const transitionProps = getTransitionProps(
  //   { style: props.style, timeout: props.timeout, easing },
  //   {
  //     mode: "exit",
  //   }
  // );

  // el.style.webkitTransition = create("-webkit-transform", transitionProps);
  // el.style.transition = create("transform", transitionProps);

  // setTranslateValue(props.direction, el, props.container);

  // Emit the event to the parent
  emits("before-leave", el);
}

// handleExiting
function onLeave(
  el: { style: { webkitTransition: string; transition: string } },
  done: () => void,
) {
  // console.log("exiting");
  state.value = "EXITING";

  const transitionProps = getTransitionProps(
    { style: props.style, timeout: props.timeout, easing },
    {
      mode: "exit",
    },
  );

  el.style.webkitTransition = create("-webkit-transform", transitionProps);
  el.style.transition = create("transform", transitionProps);

  setTranslateValue(
    props.direction as Direction,
    el as unknown as Element,
    props.container,
  );

  // Emit the event to the parent
  emits("leave", el, done);

  // Call done() when the transition ends
  // to trigger the @after-leave event.
  setTimeout(
    done,
    (props.timeout as unknown as { exit: number }).exit ||
      (props.timeout as number),
  );
}

// handleExited
function onAfterLeave(el: Element) {
  // console.log("exited");
  state.value = "EXITED";

  (el as HTMLElement).style.removeProperty("display");

  (el as HTMLElement).style.webkitTransition = "";
  (el as HTMLElement).style.transition = "";

  // Emit the event to the parent
  emits("after-leave", el);
}

function onLeaveCancelled(el: Element) {
  // console.log("leave cancelled");

  // Emit the event to the parent
  emits("leave-cancelled", el);
}
</script>

<template>
  <Transition
    :css="false"
    :name="props.name"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @enter-cancelled="onEnterCancelled"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
    @leave-cancelled="onLeaveCancelled"
  >
    <div
      v-show="props.in"
      ref="rootRef"
      :style="{
        visibility: state === 'EXITED' && !props.in ? 'hidden' : undefined,
        ...style,
      }"
    >
      <slot />
    </div>
  </Transition>
</template>

<style lang="scss"></style>

<style lang="scss" scoped></style>
