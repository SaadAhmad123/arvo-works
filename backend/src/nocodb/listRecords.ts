import { z } from 'zod';
import { NocodbApiConfig } from './config.ts';
import { RecordSchema } from './schema.ts';

export type SortOption = {
  field: string;
  direction: 'asc' | 'desc';
};

export type ListRecordsOptions = {
  fields?: string[];
  page?: number;
  pageSize?: number;
  where?: string;
  sort?: SortOption;
  viewId?: string;
  nestedPage?: number;
};

export async function listRecords<T extends z.ZodTypeAny>(
  config: NocodbApiConfig,
  responseSchema: T,
  options: ListRecordsOptions = {},
) {
  const schema = z.object({
    records: RecordSchema(responseSchema).array(),
    next: z.string().nullable().optional().default(null),
    prev: z.string().nullable().optional().default(null),
    nestedNext: z.string().nullable().optional().default(null),
    nestedPrev: z.string().nullable().optional().default(null),
  });

  const baseURL = config.baseUrl;
  const token = config.token;

  if (!baseURL || !token) {
    throw new Error(
      'NOCODB_URL and NOCODB_TOKEN environment variables must be set or provided',
    );
  }

  const endpoint = `${config.urlPath}/records`;
  const params = new URLSearchParams();
  if (options.fields) {
    options.fields.forEach((field) => params.append('fields', field));
  }
  if (options.page) {
    params.append('page', options.page.toString());
  }
  if (options.pageSize) {
    params.append('pageSize', options.pageSize.toString());
  }
  if (options.where) {
    params.append('where', options.where);
  }
  if (options.sort) {
    params.append('sort', JSON.stringify(options.sort));
  }
  if (options.viewId) {
    params.append('viewId', options.viewId);
  }
  if (options.nestedPage) {
    params.append('nestedPage', options.nestedPage.toString());
  }

  const url = `${baseURL}${endpoint}${
    params.toString() ? '?' + params.toString() : ''
  }`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xc-token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`,
      );
    }

    const data = await response.json();
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid response schema: ${JSON.stringify(error.errors, null, 2)}`,
      );
    }
    throw error;
  }
}
