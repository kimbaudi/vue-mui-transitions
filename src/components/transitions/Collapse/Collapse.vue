<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import type * as CSS from "csstype";
import { ref, onMounted } from "vue";
import { getTransitionProps } from "../utils";
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

export type Props = {
  name: string;
  in: boolean;
  collapsedSize: string | number;
  orientation: "vertical" | "horizontal";
  style: CSSProperties | undefined;
  // timeout: { appear: number, enter: number, exit: number } | number,
  // timeout: { enter: number, exit: number },
  timeout:
    | "auto"
    | number
    | {
        enter: number;
        exit: number;
      };
};

const props = withDefaults(defineProps<Props>(), {
  name: "collapse",
  collapsedSize: "0px",
  orientation: "vertical",
  style: () => ({}),
  timeout: "auto",
});

// const props = defineProps({
//   name: {
//     type: String,
//     required: false,
//     default: "collapse",
//   },
//   in: {
//     type: Boolean,
//     required: true,
//   },
//   collapsedSize: {
//     type: [Number, String],
//     required: false,
//     default: "0px",
//   },
//   orientation: {
//     type: String,
//     required: false,
//     default: "vertical",
//     validator: (value) => {
//       return ["vertical", "horizontal"].includes(value);
//     },
//   },
//   style: {
//     type: Object,
//     required: false,
//     default: () => ({}),
//   },
//   timeout: {
//     type: [Number, String, Object],
//     required: false,
//     default: "auto",
//   },
// });

const state = ref<"ENTERING" | "ENTERED" | "EXITING" | "EXITED">(
  props.in ? "ENTERED" : "EXITED",
);
const timer = ref<string | number | NodeJS.Timeout>();
const rootRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const autoTransitionDuration = ref();
const collapsedSize =
  typeof props.collapsedSize === "number"
    ? `${props.collapsedSize}px`
    : props.collapsedSize;
const isHorizontal = props.orientation === "horizontal";
const size = isHorizontal ? "width" : "height";

const { getAutoHeightDuration, easing } = createTransitions({});

const getWrapperSize = () =>
  wrapperRef.value
    ? wrapperRef.value[isHorizontal ? "clientWidth" : "clientHeight"]
    : 0;

onMounted(() => {
  // console.log("onMounted", state.value);
  if (rootRef.value) {
    rootRef.value.style.removeProperty("display");
  }

  clearTimeout(timer.value);
});

// handleEnter
function onBeforeEnter(el: Element) {
  // console.log("before entering");
  if (wrapperRef.value && isHorizontal) {
    // Set absolute position to get the size of collapsed content
    wrapperRef.value.style.position = "absolute";
  }
  (el as HTMLElement).style[size] = collapsedSize;

  // Emit the event to the parent
  emits("before-enter", el);
}

// handleEntering
function onEnter(el: Element, done: () => void) {
  // console.log("entering");
  state.value = "ENTERING";

  const wrapperSize = getWrapperSize();

  if (wrapperRef.value && isHorizontal) {
    // After the size is read reset the position back to default
    wrapperRef.value.style.position = "";
  }

  const { duration: transitionDuration, easing: transitionTimingFunction } =
    getTransitionProps(
      { style: props.style, timeout: props.timeout, easing },
      {
        mode: "enter",
      },
    );

  const duration2 =
    props.timeout === "auto"
      ? getAutoHeightDuration(wrapperSize)
      : transitionDuration;
  if (props.timeout === "auto") {
    (el as HTMLElement).style.transitionDuration = `${duration2}ms`;
    autoTransitionDuration.value = duration2;
  } else {
    (el as HTMLElement).style.transitionDuration = `${duration2}ms`;
  }

  (el as HTMLElement).style[size] = `${wrapperSize}px`;
  if (transitionTimingFunction) {
    (el as HTMLElement).style.transitionTimingFunction =
      transitionTimingFunction;
  }

  // Emit the event to the parent
  emits("enter", el, done);

  // Call done() when the transition ends
  // to trigger the @after-enter event.
  setTimeout(done, duration2 as number);
}

// handleEntered
function onAfterEnter(el: Element) {
  // console.log("entered");
  state.value = "ENTERED";

  (el as HTMLElement).style[size] = "auto";

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
  // console.log("before exiting");
  (el as HTMLElement).style[size] = `${getWrapperSize()}px`;

  // Emit the event to the parent
  emits("before-leave", el);
}

// handleExiting
function onLeave(el: Element, done: () => void) {
  // console.log("exiting");
  state.value = "EXITING";

  const wrapperSize = getWrapperSize();
  const { duration: transitionDuration, easing: transitionTimingFunction } =
    getTransitionProps(
      { style: props.style, timeout: props.timeout, easing },
      {
        mode: "exit",
      },
    );

  const duration2 =
    props.timeout === "auto"
      ? getAutoHeightDuration(wrapperSize)
      : transitionDuration;
  if (props.timeout === "auto") {
    (el as HTMLElement).style.transitionDuration = `${duration2}ms`;
    autoTransitionDuration.value = duration2;
  } else {
    (el as HTMLElement).style.transitionDuration = `${duration2}ms`;
  }

  (el as HTMLElement).style[size] = collapsedSize;
  if (transitionTimingFunction) {
    (el as HTMLElement).style.transitionTimingFunction =
      transitionTimingFunction;
  }

  // Emit the event to the parent
  emits("leave", el, done);

  // Call done() when the transition ends
  // to trigger the @after-leave event.
  setTimeout(done, duration2 as number);
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
      :class="[
        'root',
        props.orientation,
        { entered: state === 'ENTERED' },
        {
          hidden: state === 'EXITED' && !props.in && collapsedSize === '0px',
        },
      ]"
      :style="{
        [isHorizontal ? 'minWidth' : 'minHeight']: collapsedSize,
        ...style,
      }"
    >
      <div ref="wrapperRef" :class="['CollapseWrapper', props.orientation]">
        <div :class="['CollapseWrapperInner', props.orientation]">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss"></style>

<style lang="scss" scoped>
.root {
  height: 0;
  overflow: hidden;
  transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  &.horizontal {
    height: auto;
    width: 0;
    transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  }
  &.entered {
    // entered styles
    height: auto;
    overflow: visible;
    &.horizontal {
      width: auto;
    }
  }
  &.hidden {
    visibility: hidden;
  }
}

.CollapseWrapper {
  // Hack to get children with a negative margin to not falsify the height computation.
  display: flex;
  &.vertical {
    width: 100%;
  }
  &.horizontal {
    width: auto;
    height: 100%;
  }
}

.CollapseWrapperInner {
  &.vertical {
    width: 100%;
  }
  &.horizontal {
    width: auto;
    height: 100%;
  }
}
</style>
