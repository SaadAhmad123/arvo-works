import { z } from 'zod';
import { NocodbApiConfig } from './config.ts';

export async function linkRecord(
  config: NocodbApiConfig & {
    linkFieldId: string;
  },
  sourceId: string,
  targetId: string,
) {
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
      method: 'POST',
      headers: {
        'xc-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: targetId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`,
      );
    }

    const data = await response.json();
    return z.object({ success: z.boolean() }).parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid response schema: ${JSON.stringify(error.errors, null, 2)}`,
      );
    }
    throw error;
  }
}
