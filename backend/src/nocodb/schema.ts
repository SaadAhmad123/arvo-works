import z from 'zod';

export const RecordSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    id: z.union([z.string(), z.number()]),
    fields: schema,
  });
