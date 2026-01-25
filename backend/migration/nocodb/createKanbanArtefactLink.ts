export async function createKanbanArtefactLink(
  config: {
    baseUrl: string;
    token: string;
    kanbanTableId: string;
    artefactTableId: string;
    kanbanIdColumnId: string;
    artefactIdColumnId: string;
  },
) {
  const baseURL = config.baseUrl;
  const token = config.token;
  const kanbanTableId = config.kanbanTableId;

  if (
    !baseURL || !token || !kanbanTableId || !config.kanbanIdColumnId ||
    !config.artefactIdColumnId
  ) {
    throw new Error(
      'baseUrl, token, kanbanTableId, kanbanIdColumnId, and artefactIdColumnId must be provided',
    );
  }

  const url = `${baseURL}/api/v2/meta/tables/${kanbanTableId}/columns`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Artefacts',
      uidt: 'Links',
      type: 'hm',
      parentId: config.kanbanTableId,
      childId: config.artefactTableId,
      colOptions: {
        fk_parent_column_id: config.kanbanIdColumnId,
        fk_child_column_id: config.artefactIdColumnId,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`,
    );
  }

  const data =  await response.json();

  // deno-lint-ignore no-explicit-any
  const linkField = (data.columns as any[]).find(item => item.title === 'Artefacts')
  return {
    data,
    linkField,
  }
}
