import { describe, expect, expectTypeOf, it } from 'vitest';
import z from 'zod';
import { createZodDto } from 'src/zod.js';

describe('createZodDto', () => {
  const ItemSchema = z.object({ name: z.string(), count: z.coerce.number().optional() });
  class ItemDto extends createZodDto(ItemSchema) {}
  class NamedDto extends createZodDto(z.object({ id: z.uuid() }).meta({ id: 'NamedDto' })) {}
  class ShapeDto extends createZodDto({ name: z.string(), count: z.coerce.number().optional() }) {}

  it('keeps the schema as is', () => {
    expect(ItemDto.schema).toBe(ItemSchema);
    expect(z.globalRegistry.get(NamedDto.schema)?.id).toBe('NamedDto');
  });

  it('wraps a shape in an object schema', () => {
    expect(ShapeDto.schema).toBeInstanceOf(z.ZodObject);
    expect(ShapeDto.schema.parse({ name: 'item', count: '2' })).toEqual({ name: 'item', count: 2 });
  });

  it('types instances as the schema output', () => {
    expectTypeOf<ItemDto>().toEqualTypeOf<{ name: string; count?: number | undefined }>();
    expectTypeOf<NamedDto>().toEqualTypeOf<{ id: string }>();
    expectTypeOf<ShapeDto>().toEqualTypeOf<{ name: string; count?: number | undefined }>();
  });
});
