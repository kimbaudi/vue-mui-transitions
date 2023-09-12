// Corresponds to 10 frames at 60 Hz.
// A few bytes payload overhead when lodash/debounce is ~3 kB and debounce ~300 B.
export default function debounce(func: Function, wait = 166) {
  let timeout: string | number | NodeJS.Timeout | undefined;
  function debounced(...args: any[]) {
    function later(this: any) {
      func.apply(this, args);
    }
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }

  debounced.clear = () => {
    clearTimeout(timeout);
  };

  return debounced;
}
