/**
 * Observability layer — pluggable tracer.
 * Default: no-op. Replace with OpenTelemetry, Datadog, or custom implementation.
 */
import type { JsonObject, Span, Tracer } from "./types.js";

class NoOpSpan implements Span {
  end() {}
  setAttribute(_key: string, _value: unknown) {}
  recordError(_error: Error) {}
}

class NoOpTracer implements Tracer {
  startSpan(_name: string, _attrs?: JsonObject): Span {
    return new NoOpSpan();
  }
}

/** Global tracer — replace with your tracer implementation */
let globalTracer: Tracer = new NoOpTracer();

export function setGlobalTracer(t: Tracer): void {
  globalTracer = t;
}

export function getTracer(): Tracer {
  return globalTracer;
}

/** Create a span, run fn (sync or async), auto-end on success / recordError + rethrow on failure. */
export function withSpan<T>(name: string, fn: (span: Span) => T, attrs?: JsonObject): T {
  const span = globalTracer.startSpan(name, attrs);
  try {
    const result = fn(span);
    // Handle if fn returns a promise
    if (result instanceof Promise) {
      return result
        .then((v) => {
          span.end();
          return v;
        })
        .catch((err) => {
          span.recordError(err instanceof Error ? err : new Error(String(err)));
          span.end();
          throw err;
        }) as T;
    }
    span.end();
    return result;
  } catch (err) {
    span.recordError(err instanceof Error ? err : new Error(String(err)));
    span.end();
    throw err;
  }
}

/** Async variant of withSpan — use when fn is always async. */
export async function withSpanAsync<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attrs?: JsonObject,
): Promise<T> {
  const span = globalTracer.startSpan(name, attrs);
  try {
    const result = await fn(span);
    span.end();
    return result;
  } catch (err) {
    span.recordError(err instanceof Error ? err : new Error(String(err)));
    span.end();
    throw err;
  }
}