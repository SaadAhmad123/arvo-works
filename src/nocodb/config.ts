export type NocodbApiConfig = {
  baseUrl: string;
  token: string;
  baseId: string;
  tableId: string;
  urlPath: string;
};

export const createNocodbApiConfig = (config: {
  baseUrl?: string;
  token?: string;
  baseId: string;
  tableId: string;
}) => {
  return {
    baseId: config.baseId,
    tableId: config.tableId,
    token: config.token ?? Deno.env.get('NOCODB_TOKEN') ?? '',
    baseUrl: config.baseUrl ?? Deno.env.get('NOCODB_URL') ?? '',
    urlPath: `/api/v3/data/${config.baseId}/${config.tableId}`,
  } satisfies NocodbApiConfig;
};
