import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { PARAMTYPES_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { ApiResponse } from '@nestjs/swagger';
import { StandardJSONSchemaV1, StandardSchemaV1 } from '@standard-schema/spec';
import { defineMetadata, getMetadata } from 'reflect-metadata/no-conflict';
import { describe, expect, expectTypeOf, it } from 'vitest';
import z from 'zod';
import { createStandardSchemaDto, registerSchemas, toOpenApiComponents, toOpenApiSchema } from 'src/dto.js';
import { createZodDto } from 'src/zod.js';

describe('registerSchemas', () => {
  const Status = z.enum(['active', 'disabled']).meta({ id: 'Status' });
  class CreateItemDto extends createZodDto(z.object({ status: Status })) {}
  class SearchItemDto extends createZodDto(z.object({ name: z.string().optional() }).meta({ id: 'SearchItemDto' })) {}
  class ItemResponseDto extends createZodDto(z.object({ status: Status.meta({ 'x-immich-state': 'Deprecated' }) })) {}
  class ItemHeaderDto extends createZodDto(z.object({ 'x-position': z.coerce.number().optional() })) {}

  @Controller('items')
  class ItemController {
    @Post()
    @ApiResponse({ status: 201, type: ItemResponseDto })
    create(@Body() dto: CreateItemDto): ItemResponseDto {
      return dto;
    }

    @Get()
    search(@Query() dto: SearchItemDto, @Headers() headers: ItemHeaderDto): ItemResponseDto[] {
      return [{ status: dto.name && headers['x-position'] ? 'active' : 'disabled' }];
    }
  }

  registerSchemas({ controllers: [ItemController] });

  it('validates route arguments with the dto schema', () => {
    const [body] = getRouteArguments(ItemController, 'create');
    expect(body.schema).toMatchObject({ schema: CreateItemDto.schema });
  });

  it('references a body schema by the class name and lifts nested definitions', () => {
    const [body] = getRouteArguments(ItemController, 'create');
    expect(toOpenApiSchema(body.schema, { schemaType: 'input' })).toEqual({
      schema: { $ref: '#/components/schemas/CreateItemDto' },
      components: {
        CreateItemDto: {
          properties: { status: { $ref: '#/components/schemas/Status' } },
          required: ['status'],
          type: 'object',
        },
        Status: { enum: ['active', 'disabled'], type: 'string' },
      },
    });
  });

  it('references a body schema by its id when it has one', () => {
    class RenameItemDto extends createZodDto(z.object({ name: z.string() }).meta({ id: 'ItemRename' })) {}

    @Controller('items')
    class RenameController {
      @Post()
      rename(@Body() dto: RenameItemDto) {
        return dto;
      }
    }

    registerSchemas({ controllers: [RenameController] });

    const [body] = getRouteArguments(RenameController, 'rename');
    expect(toOpenApiSchema(body.schema, { schemaType: 'input' })).toEqual({
      schema: { $ref: '#/components/schemas/ItemRename' },
      components: {
        ItemRename: { properties: { name: { type: 'string' } }, required: ['name'], type: 'object' },
      },
    });
  });

  it('inlines a query schema', () => {
    const [query] = getRouteArguments(ItemController, 'search');
    expect(toOpenApiSchema(query.schema, { schemaType: 'input' })).toEqual({
      schema: { properties: { name: { type: 'string' } }, type: 'object' },
      components: {},
    });
  });

  it('turns header dtos into validated custom arguments and inline header parameters', () => {
    const [, headers] = getRouteArguments(ItemController, 'search');
    expect(headers).toMatchObject({ factory: expect.any(Function), schema: { schema: ItemHeaderDto.schema } });
    const parameters = getMetadata('swagger/apiParameters', ItemController.prototype.search) as unknown[];
    expect(parameters).toEqual([{ in: 'header', required: true, standardSchema: headers.schema }]);
  });

  it('replaces response classes with their schema', () => {
    const responses = getMetadata('swagger/apiResponse', ItemController.prototype.create) as Record<
      string,
      { standardSchema?: unknown }
    >;
    expect(toOpenApiSchema(responses[201].standardSchema, { schemaType: 'output' })).toMatchObject({
      schema: { $ref: '#/components/schemas/ItemResponseDto' },
      components: {
        ItemResponseDto: {
          properties: { status: { $ref: '#/components/schemas/Status', 'x-immich-state': 'Deprecated' } },
        },
      },
    });
  });

  it('documents a dto used as request and response with the same input schema', () => {
    class CountDto extends createZodDto(z.object({ count: z.number().default(0) })) {}

    @Controller('counts')
    class CountController {
      @Post()
      @ApiResponse({ status: 201, type: CountDto })
      create(@Body() dto: CountDto): CountDto {
        return dto;
      }
    }

    registerSchemas({ controllers: [CountController] });

    const [body] = getRouteArguments(CountController, 'create');
    const responses = getMetadata('swagger/apiResponse', CountController.prototype.create) as Record<
      string,
      { standardSchema?: unknown }
    >;
    const request = toOpenApiSchema(body.schema, { schemaType: 'input' });
    const response = toOpenApiSchema(responses[201].standardSchema, { schemaType: 'output' });
    expect(request).toMatchObject({ components: { CountDto: { properties: { count: { default: 0 } } } } });
    expect(request).not.toHaveProperty('components.CountDto.required');
    expect(response).toEqual(request);
  });

  it('ignores schemas it did not register', () => {
    expect(toOpenApiSchema(CreateItemDto.schema, { schemaType: 'input' })).toBeUndefined();
  });
});

describe('toOpenApiComponents', () => {
  it('builds components for extra models', () => {
    class ExtraDto extends createZodDto(z.object({ id: z.string() })) {}
    expect(toOpenApiComponents([ExtraDto, class {}])).toEqual({
      ExtraDto: { properties: { id: { type: 'string' } }, required: ['id'], type: 'object' },
    });
  });

  it('describes a nullable reference on the property itself', () => {
    const Kind = z.enum(['major', 'minor']).meta({ id: 'Kind' });
    class NullableReferenceDto extends createZodDto(z.object({ kind: Kind.describe('Release kind').nullable() })) {}
    expect(toOpenApiComponents([NullableReferenceDto]).NullableReferenceDto).toEqual({
      properties: {
        kind: { description: 'Release kind', anyOf: [{ $ref: '#/components/schemas/Kind' }, { type: 'null' }] },
      },
      required: ['kind'],
      type: 'object',
    });
  });

  it('describes a nullable property on the property itself', () => {
    class NullableDescribedDto extends createZodDto(z.object({ id: z.uuid().describe('Owner ID').nullable() })) {}
    expect(toOpenApiComponents([NullableDescribedDto]).NullableDescribedDto).toMatchObject({
      properties: { id: { description: 'Owner ID', format: 'uuid', type: ['string', 'null'] } },
    });
    expect(toOpenApiComponents([NullableDescribedDto]).NullableDescribedDto).not.toHaveProperty('properties.id.anyOf');
  });

  it.each([
    { name: 'enum', value: z.enum(['major', 'minor']), expected: { enum: ['major', 'minor'], type: 'string' } },
    {
      name: 'object',
      value: z.object({ name: z.string() }),
      expected: { properties: { name: { type: 'string' } }, required: ['name'], type: 'object' },
    },
  ])('keeps a nullable $name as a union with null', ({ value, expected }) => {
    class NullableDto extends createZodDto(z.object({ value: value.nullable() })) {}
    expect(toOpenApiComponents([NullableDto]).NullableDto).toMatchObject({
      properties: { value: { anyOf: [expected, { type: 'null' }] } },
    });
  });
});

describe('createStandardSchemaDto', () => {
  const NameJsonSchema = { properties: { name: { type: 'string' } }, required: ['name'], type: 'object' };
  const standard: StandardSchemaV1.Props<unknown, { name: string }> = {
    version: 1,
    vendor: 'test',
    validate: (value) => ({ value: value as { name: string } }),
  };
  const jsonStandard: StandardJSONSchemaV1.Props<unknown, { name: string }> & typeof standard = {
    ...standard,
    jsonSchema: { input: () => NameJsonSchema, output: () => NameJsonSchema },
  };

  it('types instances as the schema output', () => {
    class NameDto extends createStandardSchemaDto({ '~standard': jsonStandard }) {}
    expectTypeOf<NameDto>().toEqualTypeOf<{ name: string }>();
  });

  it.each([
    { name: 'plain object', schema: { '~standard': jsonStandard } },
    { name: 'function', schema: Object.assign(() => {}, { '~standard': jsonStandard }) },
  ])('validates and documents a body when the schema is a $name', ({ schema }) => {
    class NameDto extends createStandardSchemaDto(schema) {}
    const NameController = newNameController(NameDto);

    registerSchemas({ controllers: [NameController] });

    const [body] = getRouteArguments(NameController, 'create');
    expect(body.schema).toMatchObject({ schema });
    expect(toOpenApiSchema(body.schema, { schemaType: 'input' })).toEqual({
      schema: { $ref: '#/components/schemas/NameDto' },
      components: { NameDto: NameJsonSchema },
    });
  });

  it('validates but does not document a schema without json schema support', () => {
    class NameDto extends createStandardSchemaDto({ '~standard': standard }) {}
    const NameController = newNameController(NameDto);

    registerSchemas({ controllers: [NameController] });

    const [body] = getRouteArguments(NameController, 'create');
    expect(body.schema).toMatchObject({ schema: NameDto.schema });
    expect(toOpenApiSchema(body.schema, { schemaType: 'input' })).toBeUndefined();
  });
});

function newNameController(dto: new () => { name: string }) {
  @Controller('names')
  class NameController {
    @Post()
    create(@Body() body: { name: string }) {
      return body;
    }
  }

  defineMetadata(PARAMTYPES_METADATA, [dto], NameController.prototype, 'create');
  return NameController;
}

function getRouteArguments(controller: object, method: string) {
  type RouteArguments = Record<string, { index: number; schema?: unknown }>;
  return Object.values(getMetadata(ROUTE_ARGS_METADATA, controller, method) as RouteArguments).toSorted(
    (a, b) => a.index - b.index,
  );
}
