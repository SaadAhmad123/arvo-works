const botToken = (email: string) =>
  `<The Bot Token - Please login as '${email}', create a token and paste it here>`;

export const createEnvConfig = (config: {
  kanban: {
    baseId: string;
    tableId: string;
    artefactLinkFieldId: string;
  };
  artefact: {
    baseId: string;
    tableId: string;
  };
  bots: {
    name: string;
    email: string;
  }[];
}) => `
NOCODB_URL=http://localhost:8080
NOCODB_TOKEN=<The super admin token>

KANBAN_BASE_ID=${config.kanban.baseId}
KANBAN_TABLE_ID=${config.kanban.tableId}
KANBAN_ARTEFACT_LINK_FIELD_ID=${config.kanban.artefactLinkFieldId}

ARTEFACT_BASE_ID=${config.artefact.baseId}
ARTEFACT_TABLE_ID=${config.artefact.tableId}

${
  config.bots.map((item) =>
    `${item.name}_EMAIL=${item.email}\n${item.name}_TOKEN=${
      botToken(item.email)
    }`
  ).join('\n\n')
}

OPENAI_API_KEY=<The OpenAI Key>
ANTHROPIC_API_KEY=<The Anthropic Key>
`;
