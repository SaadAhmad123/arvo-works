import { createBase } from './nocodb/createBase.ts';
import { envVar } from './envVars.ts';
import { createKanbanTable } from './nocodb/createKanbanTable.ts';
import { createArtefactTable } from './nocodb/createArtefactTable.ts';
import { createKanbanArtefactLink } from './nocodb/createKanbanArtefactLink.ts';
import { createKanbanView } from './nocodb/createKanbanView.ts';
import { createBaseUser } from './nocodb/createBaseUser.ts';
import { createEnvConfig } from './createEnvConfig.ts';

const bots: {
  name: string;
  email: string;
}[] = [
  {
    name: 'KANBAN_BOT',
    email: 'kanban@bot.bot',
  },
];

const config = {
  baseUrl: envVar('NOCODB_URL'),
  token: envVar('NOCODB_TOKEN'),
};

async function main() {
  const base = await createBase(config, {
    title: 'Arvo Works',
  });

  const [kanban, artefacts] = await Promise.all([
    createKanbanTable({
      ...config,
      baseId: base.id,
    }),
    createArtefactTable({
      ...config,
      baseId: base.id,
    }),
  ]);

  const {linkField} = await createKanbanArtefactLink({
    ...config,
    kanbanTableId: kanban.data.id as string,
    artefactTableId: artefacts.data.id as string,
    kanbanIdColumnId: kanban.idColumn.id,
    artefactIdColumnId: artefacts.idColumn.id,
  });

  await createKanbanView({
    ...config,
    tableId: kanban.data.id as string,
  }, {
    title: 'Kanban',
    groupByColumnId: kanban.kanbanGroundField.id,
  });

  await Promise.all(bots.map((item) =>
    createBaseUser({
      ...config,
      baseId: base.id,
    }, {
      email: item.email,
      roles: 'editor',
    })
  ));

  console.log(
    createEnvConfig({
      kanban: {
        baseId: base.id,
        tableId: kanban.data.id,
        artefactLinkFieldId: linkField.id,
      },
      artefact: {
        baseId: base.id,
        tableId: artefacts.data.id,
      },
      bots,
    }),
  );
}

if (import.meta.main) {
  await main();
}
