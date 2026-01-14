import { z } from 'zod';
import { NocodbApiConfig } from './config.ts';

const CommentSchema = z.object({
  id: z.string(),
  row_id: z.string(),
  fk_model_id: z.string(),
  comment: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by_email: z.string().optional(),
}).passthrough();

const ListCommentsResponseSchema = z.object({
  list: z.array(CommentSchema),
});

type ListCommentsOptions = {
  row_id: string;
};

export async function listComments(
  config: NocodbApiConfig,
  options: ListCommentsOptions,
) {
  const baseURL = config.baseUrl;
  const token = config.token;

  if (!baseURL || !token) {
    throw new Error(
      'NOCODB_URL and NOCODB_TOKEN environment variables must be set or provided',
    );
  }

  const params = new URLSearchParams({
    row_id: options.row_id,
    fk_model_id: config.tableId,
  });

  const url = `${baseURL}/api/v2/meta/comments?${params.toString()}`;

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
    return ListCommentsResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid response schema: ${JSON.stringify(error.errors, null, 2)}`,
      );
    }
    throw error;
  }
}
