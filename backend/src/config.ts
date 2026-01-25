import { trace } from '@opentelemetry/api';
import { ArvoContract } from 'arvo-core';
import { kanbanAgentContract } from './handlers/agent.kanban.ts';
import { envVar } from './envVars.ts';
import { KanbanBoard } from './nocodb/KanbanBoard.ts';
import z from 'zod';
import { createNocodbApiConfig } from './nocodb/config.ts';

export const INTERNAL_EVENT_SOURCE = 'amas.kanban.source';

export const tracer = trace.getTracer('main-agent-tracer');

export const botConfig: Record<string, {
  email: string;
  // Lazy getter to avoid circular import
  contract: () => ArvoContract;
  nocodbToken: string;
}> = Object.fromEntries(
  [
    {
      email: envVar('KANBAN_BOT_EMAIL'),
      contract: () => kanbanAgentContract,
      nocodbToken: envVar('KANBAN_BOT_TOKEN'),
    },
  ].map((item) => [item.email, item]),
);

export const isBotEmail = (email: string) =>
  Object.keys(botConfig).includes(email);

export const cardSchema = z.object({
  Title: z.string().nullable().optional(),
  'Task Board Select Field': z.enum([
    'TODO',
    'PROGRESSING',
    'DONE',
    'FINALIZED',
  ]),
  Description: z.string().nullable().optional(),
  Result: z.string().nullable().optional(),
  Rationale: z.string().nullable().optional(),
  Assigned: z.object({
    id: z.string(),
    email: z.string(),
  }).array().nullable().optional(),
});

const artefactSchema = z.object({
  Title: z.string(),
  'Additional Details': z.string().optional().nullable(),
  Content: z.string().optional().nullable(),
});

export const getBoard = (param: {
  botEmail?: string;
  token?: string;
}) => {
  const { botEmail, token } = param;

  if ((!botEmail && !token) || (botEmail && token)) {
    throw new Error('Either botEmail or token must be defined');
  }

  if (botEmail && !botConfig[botEmail]) {
    throw new Error(`Bot Email ${botEmail} is invalid`);
  }

  const nocodbToken = botEmail ? botConfig[botEmail].nocodbToken : token;
  return new KanbanBoard(
    {
      ...createNocodbApiConfig({
        token: nocodbToken ?? '',
        baseId: envVar('KANBAN_BASE_ID'),
        tableId: envVar('KANBAN_TABLE_ID'),
      }),
      artefactLinkFieldId: envVar('KANBAN_ARTEFACT_LINK_FIELD_ID'),
    },
    cardSchema,
    'Task Board Select Field',
    createNocodbApiConfig({
      token: nocodbToken ?? '',
      baseId: envVar('ARTEFACT_BASE_ID'),
      tableId: envVar('ARTEFACT_TABLE_ID'),
    }),
    artefactSchema,
  );
};
