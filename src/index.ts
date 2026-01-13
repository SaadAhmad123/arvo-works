import z from 'zod';
import { createNocodbApiConfig } from './nocodb/config.ts';
import './otel.ts';
import { load } from '@std/dotenv';
import { KanbanBoard } from './nocodb/KanbanBoard.ts';
await load({ export: true });

const nocodbApiConfig = createNocodbApiConfig({
  baseId: 'pox9b2eyg6vn36m',
  tableId: 'mboooj1tgr2fxq4',
});

const schema = z.object({
  Title: z.string(),
  'Task Board Select Field': z.enum(['TODO', 'PROGRESSING', 'DONE']),
  Description: z.string(),
  Assigned: z.object({
    id: z.string(),
    email: z.string(),
  }).array(),
});

const kb = new KanbanBoard(nocodbApiConfig, schema, 'Task Board Select Field');
const records = await kb.list(['PROGRESSING', 'TODO'], {
  filter: (data) => data?.Assigned?.[0]?.email === 'saad.ahmad@bot.com',
});
console.log(JSON.stringify(records, null, 2));
