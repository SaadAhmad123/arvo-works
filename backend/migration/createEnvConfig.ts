const botToken = (email: string) => `<Bot Token for '${email}' - See 'How To Obtain Bot Token' below>`;

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

#### Copy the following you your '.env'

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


####### How To Obtain Bot Token #######
#  1. Go to http://localhost:6001/dashboard/#/account/users/list
#  2. Find the bot email and click the actions dropdown on the right
#  3. Copy the invite URL
#  4. Open the invite URL in incognito mode (to avoid logging out) and sign up as the bot.
#      Make sure that you use the bot email.
#  5. Go to http://localhost:6001/dashboard/#/account/tokens
#  6. Create a new token and paste it here
`;
