import { z } from 'zod';
import { NocodbApiConfig } from './config.ts';

export async function updateRecord<T extends z.ZodTypeAny>(
  config: NocodbApiConfig,
  recordSchema: T,
  id: string,
  fields: Partial<z.infer<T>>,
) {
  const responseSchema = z.object({
    records: z.array(
      z.object({
        id: z.union([z.string(), z.number()]),
        fields: recordSchema,
      }),
    ),
  });

  const baseURL = config.baseUrl;
  const token = config.token;

  if (!baseURL || !token) {
    throw new Error(
      'NOCODB_URL and NOCODB_TOKEN environment variables must be set or provided',
    );
  }

  const endpoint = `${config.urlPath}/records`;
  const url = `${baseURL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'xc-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        fields,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`,
      );
    }

    const data = await response.json();
    return responseSchema.parse(data).records[0];
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid response schema: ${JSON.stringify(error.errors, null, 2)}`,
      );
    }
    throw error;
  }
}
