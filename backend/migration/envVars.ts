import { load } from '@std/dotenv';
await load({ export: true });

const settingVars = [
  'NOCODB_URL',
  'NOCODB_TOKEN',
] as const;

export const envVar = (name: typeof settingVars[number]): string => {
  const val = Deno.env.get(name);
  if (!val) {
    throw new Error(
      `
The .env file must have variable: ${name} for the system to work properly.

Please make sure that you have \`.env\` file with the following fields:
\`\`\`bash
# .env
NOCODB_URL=http://localhost:8080
NOCODB_TOKEN=<the super admin token>
\`\`\`
      `,
    );
  }
  return val;
};
