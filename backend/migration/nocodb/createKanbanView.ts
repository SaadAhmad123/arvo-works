export async function createKanbanView(
  config: {
    baseUrl: string;
    token: string;
    tableId: string;
  },
  options: {
    title: string;
    groupByColumnId: string;
  },
) {
  const baseURL = config.baseUrl;
  const token = config.token;
  const tableId = config.tableId;

  if (!baseURL || !token || !tableId || !options.groupByColumnId) {
    throw new Error(
      'baseUrl, token, tableId, and groupByColumnId must be provided',
    );
  }

  const url = `${baseURL}/api/v2/meta/tables/${tableId}/kanbans`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: options.title,
      type: 4,
      fk_grp_col_id: options.groupByColumnId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`,
    );
  }

  return await response.json();
}
