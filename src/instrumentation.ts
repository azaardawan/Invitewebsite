import type { Instrumentation } from 'next';

/** Starts the in-process background jobs on the Node.js server (not during builds or on the edge). */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./server/scheduler');
    startScheduler();
  }
}

/**
 * Every unhandled server error as one structured log line (Railway → Deploy Logs, searchable by
 * `level":"error`). No request bodies, cookies or query strings: they can carry private tokens.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const err = error as Error & { digest?: string };
  console.error(
    JSON.stringify({
      level: 'error',
      msg: 'request_failed',
      digest: err.digest ?? null,
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 6).join(' | '),
      method: request.method,
      route: context.routePath,
      routeType: context.routeType,
    }),
  );
};
