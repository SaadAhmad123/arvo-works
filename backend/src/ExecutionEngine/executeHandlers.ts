import {
  ConcurrentMachineMemory,
  createConcurrentEventBroker,
} from '@arvo-tools/concurrent';
import { ArvoEvent } from 'arvo-core';
import { kanbanAgent } from '../handlers/agent.kanban.ts';
import { calculatorAgent } from '../handlers/agent.calculator.ts';
import { calculatorHandler } from '../handlers/service.calculator.ts';
import { codeAgent } from '../handlers/agent.code.ts';
import { SimplePermissionManager } from '@arvo-tools/agentic';

const memory = new ConcurrentMachineMemory({ enableCleanup: true });
const permissionManager = new SimplePermissionManager({
  domains: ['human.interaction'],
  enableCleanUp: true,
  permissionPersistance: 'WORKFLOW_WIDE',
});

export const executeHandlers = async (
  event: ArvoEvent,
): Promise<ArvoEvent[]> => {
  const domainedEvents: ArvoEvent[] = [];
  const response = await createConcurrentEventBroker([
    { handler: kanbanAgent({ memory, permissionManager }) },
    { handler: calculatorAgent({ memory }) },
    { handler: calculatorHandler() },
    { handler: codeAgent({ memory }) },
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
