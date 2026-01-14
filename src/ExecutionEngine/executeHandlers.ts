import {
  ConcurrentMachineMemory,
  createConcurrentEventBroker,
} from '@arvo-tools/concurrent';
import { ArvoEvent } from 'arvo-core';
import { kanbanAgent } from '../handlers/agent.kanban/index.ts';
import { calculatorAgent } from '../handlers/calculator.agent.ts';
import { calculatorHandler } from '../handlers/calculator.service.ts';

const memory = new ConcurrentMachineMemory();

export const executeHandlers = async (
  event: ArvoEvent,
): Promise<ArvoEvent[]> => {
  const domainedEvents: ArvoEvent[] = [];
  const response = await createConcurrentEventBroker([
    { handler: kanbanAgent({ memory }) },
    { handler: calculatorAgent({ memory }) },
    { handler: calculatorHandler() },
  ], {
    defaultHandlerConfig: {
      prefetch: 10,
    },
    onDomainedEvents: async ({ event }) => {
      domainedEvents.push(event);
    },
  }).resolve(event);
  return response ? [response, ...domainedEvents] : domainedEvents;
};
