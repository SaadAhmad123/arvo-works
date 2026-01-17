import { ArvoEvent } from 'arvo-core';
import { context, SpanContext, trace } from '@opentelemetry/api';

/**
 * Generates a random 4-character alphanumeric identifier using uppercase letters and digits.
 *
 * This function creates a unique identifier by randomly selecting characters from a predefined
 * set of uppercase letters (A-Z) and digits (0-9). The resulting ID is always 4 characters long.
 *
 * @returns A 4-character random alphanumeric string in uppercase format
 *
 * @example
 * ```typescript
 * const id = generateRandomId();
 * console.log(id); // Output: "A3B7" (example, actual output will vary)
 * ```
 *
 * @example
 * ```typescript
 * // Generate multiple unique IDs
 * const ids = Array.from({ length: 3 }, () => generateRandomId());
 * console.log(ids); // Output: ["X9K2", "P4M8", "Q1N5"] (example)
 * ```
 */
export function generateRandomId(): string {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';

  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters[randomIndex];
  }

  return id;
}

/**
 * Creates an OpenTelemetry context from an ArvoEvent's trace parent information.
 *
 * This function extracts distributed tracing information from an ArvoEvent and creates
 * an OpenTelemetry context that can be used to maintain trace continuity across
 * service boundaries. If the event contains valid traceparent data, it parses the
 * trace ID, span ID, and trace flags to create a proper span context.
 *
 * @param event - The ArvoEvent containing potential traceparent information
 * @returns An OpenTelemetry context with span context set if traceparent is valid,
 *          otherwise returns the currently active context
 *
 * @example
 * ```typescript
 * const event: ArvoEvent = {
 *   traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
 *   // ... other event properties
 * };
 *
 * const otelContext = createOtelContextFromEvent(event);
 * // Use the context for tracing operations
 * ```
 *
 * @example
 * ```typescript
 * // Handle event without traceparent
 * const eventWithoutTrace: ArvoEvent = {
 *   // ... event properties without traceparent
 * };
 *
 * const context = createOtelContextFromEvent(eventWithoutTrace);
 * // Returns the currently active context
 * ```
 */
export function createOtelContextFromEvent(event: ArvoEvent) {
  const traceParent = event.traceparent;
  let parentContext = context.active();
  if (traceParent) {
    const parts = traceParent.split('-');
    if (parts.length === 4) {
      const [_, traceId, spanId, traceFlags] = parts;
      const spanContext: SpanContext = {
        traceId,
        spanId,
        traceFlags: Number.parseInt(traceFlags),
      };
      parentContext = trace.setSpanContext(context.active(), spanContext);
    }
  }
  return parentContext;
}
