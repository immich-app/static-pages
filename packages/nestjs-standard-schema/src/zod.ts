import { StandardSchemaV1 } from '@standard-schema/spec';
import { DtoClass } from 'src/dto.js';
import z from 'zod';

type ToSchema<T> = T extends StandardSchemaV1 ? T : T extends z.core.$ZodLooseShape ? z.ZodObject<T> : never;

export const createZodDto = <T extends z.ZodType | z.core.$ZodLooseShape>(schema: T): DtoClass<ToSchema<T>> =>
  class {
    static readonly schema = '~standard' in schema ? schema : z.object(schema);
  } as unknown as DtoClass<ToSchema<T>>;
