export async function createArtefactTable(
  config: {
    baseUrl: string;
    token: string;
    baseId: string;
  },
) {
  const baseURL = config.baseUrl;
  const token = config.token;
  const baseId = config.baseId;
  const tableName = 'artefact_table';
  const title = 'Artefacts';

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
          title: 'Content',
          uidt: 'LongText',
          meta: {
            richText: true,
          },
        },
        {
          title: 'Additional Details',
          uidt: 'LongText',
          meta: {
            richText: true,
          },
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
  const idColumn = (data.columns as Array<any>).find((item) =>
    item.column_name === 'id'
  );

  return {
    data,
    idColumn: idColumn as { id: string; title: string },
  };
}
