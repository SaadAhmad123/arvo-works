import { envVar } from '../envVars.ts';

export type NocodbApiConfig = {
  baseUrl: string;
  token: string;
  baseId: string;
  tableId: string;
  urlPath: string;
};

export const createNocodbApiConfig = (config: {
  baseUrl?: string;
  token: string;
  baseId: string;
  tableId: string;
}) => {
  return {
    baseId: config.baseId,
    tableId: config.tableId,
    token: config.token,
    baseUrl: config.baseUrl ?? envVar('NOCODB_URL'),
    urlPath: `/api/v3/data/${config.baseId}/${config.tableId}`,
  } satisfies NocodbApiConfig;
};
