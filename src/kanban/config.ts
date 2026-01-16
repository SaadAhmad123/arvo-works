import z from 'zod';
import { load } from '@std/dotenv';
import { createNocodbApiConfig } from '../nocodb/config.ts';
import { KanbanBoard } from '../nocodb/KanbanBoard.ts';
import { CardSeenMemory } from './CardSeenMemory.ts';
await load({ export: true });

const kanbanApiConfig = createNocodbApiConfig({
  baseId: Deno.env.get('KANBAN_BASE_ID') ?? '',
  tableId: Deno.env.get('KANBAN_TABLE_ID') ?? '',
});

const kanbanArtefactLinkField = Deno.env.get('KANBAN_ARTEFACT_LINK_FIELD_ID') ??
  '';

const artefactApiConfig = createNocodbApiConfig({
  baseId: Deno.env.get('ARTEFACT_BASE_ID') ?? '',
  tableId: Deno.env.get('ARTEFACT_TABLE_ID') ?? '',
});

const cardSchema = z.object({
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

export const board = new KanbanBoard(
  {
    ...kanbanApiConfig,
    artefactLinkFieldId: kanbanArtefactLinkField,
  },
  cardSchema,
  'Task Board Select Field',
  artefactApiConfig,
  artefactSchema,
);

export const cardSeenMemory = new CardSeenMemory();
