import z from 'zod';
import { load } from '@std/dotenv';
import { createNocodbApiConfig } from '../nocodb/config.ts';
import { KanbanBoard } from '../nocodb/KanbanBoard.ts';
import { CardSeenMemory } from './CardSeenMemory.ts';
await load({ export: true });

const nocodbApiConfig = createNocodbApiConfig({
  baseId: 'pox9b2eyg6vn36m',
  tableId: 'mboooj1tgr2fxq4',
});

const schema = z.object({
  Title: z.string().nullable().optional(),
  'Task Board Select Field': z.enum(['TODO', 'PROGRESSING', 'DONE']),
  Description: z.string().nullable().optional(),
  Result: z.string().nullable().optional(),
  Rationale: z.string().nullable().optional(),
  Assigned: z.object({
    id: z.string(),
    email: z.string(),
  }).array().nullable().optional(),
});

export const board = new KanbanBoard(
  nocodbApiConfig,
  schema,
  'Task Board Select Field',
);
export const cardSeenMemory = new CardSeenMemory();
export const botEmail = 'saad.ahmad@bot.com';
