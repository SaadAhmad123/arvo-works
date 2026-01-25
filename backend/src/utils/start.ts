/**
 * Runs an async function repeatedly with a delay until user presses Ctrl+C
 * @param fn The async function to execute repeatedly
 * @param delayMs Delay in milliseconds between executions (default: 5000ms)
 */
export async function start(
  fn: () => Promise<void>,
  delayMs: number = 5000,
): Promise<void> {
  const abortController = new AbortController();
  const signal = abortController.signal;

  // Handle Ctrl+C using Deno's signal listener
  const sigintHandler = () => {
    abortController.abort();
  };
  Deno.addSignalListener('SIGINT', sigintHandler);

  console.log('Press Ctrl+C to exit...\n');

  try {
    while (!signal.aborted) {
      await fn();

      if (!signal.aborted) {
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, delayMs);
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            resolve(undefined);
          }, { once: true });
        });
      }
    }
  } finally {
    Deno.removeSignalListener('SIGINT', sigintHandler);
    console.log('\nExiting...');
  }
}
