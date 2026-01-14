import { trace } from '@opentelemetry/api';

export const INTERNAL_EVENT_SOURCE = 'amas.kanban.source';
export const tracer = trace.getTracer('main-agent-tracer');
