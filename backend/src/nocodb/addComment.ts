import { z } from 'zod';
import { NocodbApiConfig } from './config.ts';

const CommentResponseSchema = z.object({
  id: z.string(),
  row_id: z.string(),
  comment: z.string(),
  created_by: z.string(),
  resolved_by: z.string(),
  parent_comment_id: z.string().nullable().optional(),
  source_id: z.string().nullable().optional(),
  base_id: z.string(),
  fk_model_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  status: z.string().nullable().optional(),
}).partial().passthrough();

type AddCommentOptions = {
  row_id: string;
  comment: string;
};

export async function addComment(
  config: NocodbApiConfig,
  options: AddCommentOptions,
) {
  const baseURL = config?.baseUrl;
  const token = config?.token ?? Deno.env.get('NOCODB_TOKEN');

  if (!baseURL || !token) {
    throw new Error(
      'NOCODB_URL and NOCODB_TOKEN environment variables must be set or provided',
    );
  }

  const url = `${baseURL}/api/v2/meta/comments`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xc-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: options.comment,
        fk_model_id: config.tableId,
        row_id: options.row_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`,
      );
    }

    const data = await response.json();
    return CommentResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid response schema: ${JSON.stringify(error.errors, null, 2)}`,
      );
    }
    throw error;
  }
}
