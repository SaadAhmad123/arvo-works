import { z } from 'zod';
import { NocodbApiConfig } from './config.ts';
import { RecordSchema } from './schema.ts';

export async function listLinkedRecords<T extends z.ZodTypeAny>(
  config: NocodbApiConfig & {
    linkFieldId: string;
  },
  responseSchema: T,
  sourceId: string,
) {
  const schema = z.object({
    records: RecordSchema(responseSchema).array(),
  });

  const baseURL = config.baseUrl;
  const token = config.token;

  if (!baseURL || !token) {
    throw new Error(
      'NOCODB_URL and NOCODB_TOKEN environment variables must be set or provided',
    );
  }

  const endpoint = `${config.urlPath}/links/${config.linkFieldId}/${sourceId}`;
  const url = `${baseURL}${endpoint}`;

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
