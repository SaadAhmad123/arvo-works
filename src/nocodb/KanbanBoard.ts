import z from 'zod';
import { type NocodbApiConfig } from './config.ts';
import { listRecords } from './listRecords.ts';
import { getRecord } from './getRecord.ts';
import { listComments } from './listComments.ts';
import { updateRecord } from './updateRecord.ts';
import { RecordSchema } from './schema.ts';
import { addComment } from './addComment.ts';
import { createRecord } from './createRecords.ts';
import { linkRecord } from './linkRecord.ts';
import { listLinkedRecords } from './listLinkedRecords.ts';

export class KanbanBoard<
  T extends z.ZodTypeAny = z.ZodTypeAny,
  A extends z.ZodTypeAny = z.ZodTypeAny,
  S extends keyof z.infer<T> = keyof z.infer<T>,
> {
  constructor(
    private readonly tableConfig: NocodbApiConfig & {
      artefactLinkFieldId: string;
    },
    private readonly tableSchema: T,
    private readonly kanbanStageField: S,
    private readonly artefactConfig: NocodbApiConfig,
    private readonly artefactSchema: A,
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
    const recordSchema = RecordSchema(this.tableSchema);
    let data: z.infer<typeof recordSchema>[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const resp = await listRecords(this.tableConfig, this.tableSchema, {
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
    const [comments, data, artefacts] = await Promise.all([
      listComments(this.tableConfig, { row_id: id }),
      getRecord(this.tableConfig, this.tableSchema, id),
      this.listArtefacts(id),
    ]);
    return {
      id,
      card: data.fields,
      artefacts: artefacts.records,
      comments: comments.list,
    };
  }

  async update(id: string, data: Partial<z.infer<T>>) {
    return await updateRecord(this.tableConfig, this.tableSchema, id, data);
  }

  async updateStage(id: string, stage: z.infer<T>[S]) {
    // deno-lint-ignore no-explicit-any
    return await this.update(id, { [this.kanbanStageField]: stage } as any);
  }

  async comment(id: string, comment: string) {
    return await addComment(this.tableConfig, { row_id: id, comment });
  }

  async createArtefact(id: string, data: z.infer<A>) {
    const resp = await createRecord(
      this.artefactConfig,
      this.artefactSchema,
      data,
    );
    const { success } = await linkRecord(
      {
        ...this.tableConfig,
        linkFieldId: this.tableConfig.artefactLinkFieldId,
      },
      id,
      resp?.records?.[0]?.id?.toString() ?? '',
    );
    if (!success) {
      throw new Error(`Unable to link the artefact for card ID:${id}`);
    }
    return resp.records[0];
  }

  async getArtefact(id: string) {
    return await getRecord(this.artefactConfig, this.artefactSchema, id);
  }

  async listArtefacts(id: string) {
    return await listLinkedRecords(
      {
        ...this.tableConfig,
        linkFieldId: this.tableConfig.artefactLinkFieldId,
      },
      this.artefactSchema,
      id,
    );
  }
}
