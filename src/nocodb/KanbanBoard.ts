import z from 'zod';
import { type NocodbApiConfig } from './config.ts';
import { listRecords } from './listRecords.ts';
import { getRecord } from './getRecord.ts';
import { listComments } from './listComments.ts';
import { updateRecord } from './updateRecord.ts';
import { RecordSchema } from './schema.ts';

export class KanbanBoard<T extends z.ZodTypeAny, S extends keyof z.infer<T>> {
  constructor(
    private readonly config: NocodbApiConfig,
    private readonly schema: T,
    private readonly kanbanStageField: S,
  ) {
  }

  async list(
    stages: z.infer<T>[S][],
    options?: {
      filter?: (data?: z.infer<T>) => boolean;
      pageSize?: number;
      maxPages?: number;
    },
  ) {
    const { pageSize = 100, maxPages = 1000, filter = (() => true) } =
      options ?? {};
    const recordSchema = RecordSchema(this.schema);
    let data: z.infer<typeof recordSchema>[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const resp = await listRecords(this.config, this.schema, {
        page,
        pageSize,
        where: stages.map((stage) =>
          `('${this.kanbanStageField.toString()}', eq, '${stage}')`
        ).join('~or'),
      });
      data = [
        ...data,
        ...resp.records.filter((item) => filter(item.fields)),
      ];
      if (!resp.next) break;
    }
    return data;
  }

  async get(id: string) {
    const [comments, data] = await Promise.all([
      listComments(this.config, { row_id: id }),
      getRecord(this.config, this.schema, id),
    ]);
    return { id, card: data.fields, comments: comments.list };
  }

  async update(id: string, data: Partial<z.infer<T>>) {
    return await updateRecord(this.config, this.schema, id, data);
  }

  async updateStage(id: string, stage: z.infer<T>[S]) {
    // deno-lint-ignore no-explicit-any
    return await this.update(id, { [this.kanbanStageField]: stage } as any);
  }
}
