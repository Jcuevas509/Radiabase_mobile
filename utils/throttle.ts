/** Leading + trailing throttle (the lodash subset the app uses), with
 * `cancel()` for unmount cleanup. */
export function throttle<Args extends readonly unknown[]>(
  callback: (...args: Args) => void,
  waitMs: number,
): ((...args: Args) => void) & { cancel: () => void } {
  let lastCallTime = 0;
  let trailingTimer: ReturnType<typeof setTimeout> | null = null;
  let trailingArgs: Args | null = null;

  const invoke = (args: Args) => {
    lastCallTime = Date.now();
    callback(...args);
  };

  const throttled = (...args: Args) => {
    const elapsed = Date.now() - lastCallTime;
    if (elapsed >= waitMs) {
      invoke(args);
      return;
    }
    trailingArgs = args;
    if (!trailingTimer) {
      trailingTimer = setTimeout(() => {
        trailingTimer = null;
        if (trailingArgs) {
          const args = trailingArgs;
          trailingArgs = null;
          invoke(args);
        }
      }, waitMs - elapsed);
    }
  };

  throttled.cancel = () => {
    if (trailingTimer) {
      clearTimeout(trailingTimer);
      trailingTimer = null;
    }
    trailingArgs = null;
  };

  return throttled;
}
