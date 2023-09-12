<!-- eslint-disable vue/multi-word-component-names -->
<script lang="ts">
import type * as CSS from "csstype";
import { ref, onMounted } from "vue";
import { getTransitionProps, reflow } from "../utils";
import createTransitions from "../createTransitions";

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

// eslint-disable-next-line vue/no-dupe-keys
const { create, duration, easing } = createTransitions({});

const styles = {
  ENTERING: { opacity: 1 },
  ENTERED: { opacity: 1 },
  EXITING: { opacity: 0 },
  EXITED: { opacity: 0 },
};

const defaultTimeout = {
  enter: duration.enteringScreen,
  exit: duration.leavingScreen,
};

export type Props = {
  name: string;
  appear: boolean;
  easing:
    | string
    | {
        easeInOut: string;
        easeOut: string;
        easeIn: string;
        sharp: string;
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
//     default: "fade",
//   },
//   appear: {
//     type: Boolean,
//     required: false,
//     default: true,
//   },
//   easing: {
//     type: [String, Object],
//     required: false,
//     default: undefined,
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
  name: "fade",
  appear: true,
  easing: undefined,
  in: false,
  style: () => ({}),
  timeout: () => defaultTimeout,
});

// const props = defineProps(def);

const state = ref<"ENTERING" | "ENTERED" | "EXITING" | "EXITED">(
  props.in ? "ENTERED" : "EXITED",
);
const rootRef = ref<HTMLElement | null>(null);

onMounted(() => {
  // console.log("onMounted", state.value);
  if (rootRef.value) {
    rootRef.value.style.removeProperty("display");
  }
});

// handleEnter
function onBeforeEnter(el: Element) {
  // console.log("before enter");

  // reflow(el); // So the animation always start from the start.

  // const transitionProps = getTransitionProps(
  //   { style: props.style, timeout: props.timeout, easing },
  //   {
  //     mode: "enter",
  //   }
  // );

  // el.style.webkitTransition = create("opacity", transitionProps);
  // el.style.transition = create("opacity", transitionProps);

  // Emit the event to the parent
  emits("before-enter", el);
}

// handleEntering
function onEnter(el: Element, done: () => void) {
  // console.log("entering");
  state.value = "ENTERING";

  reflow(el); // So the animation always start from the start.

  const transitionProps = getTransitionProps(
    { style: props.style, timeout: props.timeout, easing },
    {
      mode: "enter",
    },
  );

  (el as HTMLElement).style.webkitTransition = create(
    "opacity",
    transitionProps,
  );
  (el as HTMLElement).style.transition = create("opacity", transitionProps);

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

  // el.style.webkitTransition = create("opacity", transitionProps);
  // el.style.transition = create("opacity", transitionProps);

  // Emit the event to the parent
  emits("before-leave", el);
}

// handleExiting
function onLeave(el: Element, done: () => void) {
  // console.log("exiting");
  state.value = "EXITING";

  const transitionProps = getTransitionProps(
    { style: props.style, timeout: props.timeout, easing },
    {
      mode: "exit",
    },
  );

  (el as HTMLElement).style.webkitTransition = create(
    "opacity",
    transitionProps,
  );
  (el as HTMLElement).style.transition = create("opacity", transitionProps);

  // Emit the event to the parent
  emits("leave", el, done);

  // Call done() when the transition ends
  // to trigger the @after-leave event.
  // setTimeout(done, props.timeout.exit || props.timeout);
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
        // opacity: 0,
        visibility: state === 'EXITED' && !!props.in ? 'hidden' : undefined,
        ...styles[state],
        ...style,
      }"
    >
      <slot />
    </div>
  </Transition>
</template>

<style lang="scss"></style>

<style lang="scss" scoped></style>
