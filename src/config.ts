import { trace } from '@opentelemetry/api';
import { ArvoContract } from 'arvo-core';
import { kanbanAgentContract } from './handlers/agent.kanban.ts';

export const INTERNAL_EVENT_SOURCE = 'amas.kanban.source';
export const tracer = trace.getTracer('main-agent-tracer');

export const botEmails: Record<string, ArvoContract> = {
  'bot@bot.com': kanbanAgentContract,
};
