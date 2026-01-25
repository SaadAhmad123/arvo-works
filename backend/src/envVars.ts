import { load } from '@std/dotenv';
import { cleanString } from 'arvo-core';
await load({ export: true });

const settingVars = [
  'NOCODB_URL',
  'KANBAN_BOT_EMAIL',
  'KANBAN_BOT_TOKEN',
  'KANBAN_BASE_ID',
  'KANBAN_TABLE_ID',
  'KANBAN_ARTEFACT_LINK_FIELD_ID',
  'ARTEFACT_BASE_ID',
  'ARTEFACT_TABLE_ID',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'NOCODB_TOKEN',
] as const;

export const envVar = (name: typeof settingVars[number]): string => {
  const val = Deno.env.get(name);
  if (!val) {
    throw new Error(cleanString(`
      The .env file must have variable: ${name} for the system to work   
      properly.
    `));
  }
  return val;
};
