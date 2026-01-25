export async function createKanbanTable(
  config: {
    baseUrl: string;
    token: string;
    baseId: string;
  },
) {
  const baseURL = config.baseUrl;
  const token = config.token;
  const baseId = config.baseId;
  const tableName = 'kanban_table';
  const title = 'Kanban Table';

  if (!baseURL || !token || !baseId) {
    throw new Error('baseUrl, token, and baseId must be provided');
  }

  const url = `${baseURL}/api/v2/meta/bases/${baseId}/tables`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      table_name: tableName,
      title: title,
      columns: [
        {
          'ai': true,
          'altered': 1,
          'cdf': null,
          'ck': false,
          'clen': null,
          'column_name': 'id',
          'ct': 'int(11)',
          'dt': 'int',
          'dtx': 'integer',
          'dtxp': '11',
          'dtxs': '',
          'np': 11,
          'nrqd': false,
          'ns': 0,
          'pk': true,
          'rqd': true,
          'title': 'Id',
          'uicn': '',
          'uidt': 'ID',
          'uip': '',
          'un': true,
        },
        {
          title: 'Title',
          uidt: 'SingleLineText',
          rqd: false,
        },
        {
          title: 'Task Board Select Field',
          uidt: 'SingleSelect',
          cdf: 'TODO',
          colOptions: {
            options: [
              { title: 'TODO', color: '#3498db' },
              { title: 'PROGRESSING', color: '#f39c12' },
              { title: 'DONE', color: '#2ecc71' },
              { title: 'FINALIZED', color: '#9b59b6' },
            ],
          },
        },
        {
          title: 'Description',
          uidt: 'LongText',
          meta: {
            richText: true,
          },
        },
        {
          title: 'Result',
          uidt: 'LongText',
          meta: {
            richText: true,
          },
        },
        {
          title: 'Rationale',
          uidt: 'LongText',
          meta: {
            richText: true,
          },
        },
        {
          title: 'Assigned',
          uidt: 'User',
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`,
    );
  }

  const data = await response.json();

  // deno-lint-ignore no-explicit-any
  const kanbanGroundField = (data.columns as Array<any>).find((item) =>
    item.title === 'Task Board Select Field'
  );
  // deno-lint-ignore no-explicit-any
  const idColumn = (data.columns as Array<any>).find((item) =>
    item.column_name === 'id'
  );

  return {
    data,
    kanbanGroundField: kanbanGroundField as { id: string; title: string },
    idColumn: idColumn as { id: string; title: string },
  };
}
