import { ExecutionContext, Type } from '@nestjs/common';
import { CUSTOM_ROUTE_ARGS_METADATA, PARAMTYPES_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { ApiBodyOptions } from '@nestjs/swagger';
import { StandardJSONSchemaV1, StandardSchemaV1 } from '@standard-schema/spec';
import { defineMetadata, getMetadata } from 'reflect-metadata/no-conflict';
import type { DtoClass } from 'src/dto.js';

export type SchemaObject = Extract<ApiBodyOptions, { schema: unknown }>['schema'];
export type SchemaReference = { '~standard': StandardSchemaV1.Props; schema: StandardSchemaV1; name?: string };
export type Parameter = { description?: string; schema?: unknown };

type JsonSchema = Record<string, unknown>;
type GeneratedJsonSchema = { $ref?: string; $schema?: string; $defs?: Record<string, JsonSchema> } & JsonSchema;
// eslint-disable-next-line unicorn/prefer-smaller-scope
type RouteArgument = { index: number; data?: unknown; factory?: unknown; schema?: unknown };
type SwaggerSchema = { in?: string; type?: unknown; standardSchema?: unknown };

const COMPOSITE_SCHEMA_KEYWORDS = new Set(['$ref', 'enum', 'const', 'anyOf', 'oneOf', 'allOf', 'not']);
const TYPE_LIST_NULLABLE_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'array']);
const API_PARAMETERS_METADATA = 'swagger/apiParameters';
const API_RESPONSE_METADATA = 'swagger/apiResponse';

export const registerRouteArguments = (controller: Type, method: string, handler: object) => {
  const paramtypes: unknown[] = getMetadata(PARAMTYPES_METADATA, controller.prototype, method) ?? [];
  const routeArguments: Record<string, RouteArgument> = { ...getMetadata(ROUTE_ARGS_METADATA, controller, method) };
  for (const [key, argument] of Object.entries(routeArguments)) {
    const type = paramtypes[argument.index];
    if (argument.schema !== undefined || !isDtoClass(type)) {
      continue;
    }

    const paramtype = Number(key.split(':', 1)[0]);
    if (paramtype === RouteParamtypes.BODY) {
      argument.schema = toSchemaReference(type, { reference: true });
    } else if (paramtype === RouteParamtypes.QUERY || paramtype === RouteParamtypes.PARAM) {
      argument.schema = toSchemaReference(type, { reference: false });
    } else if (paramtype === RouteParamtypes.HEADERS && argument.data === undefined) {
      const schema = toSchemaReference(type, { reference: false });
      delete routeArguments[key];
      routeArguments[`${paramtype}${CUSTOM_ROUTE_ARGS_METADATA}:${argument.index}`] = {
        ...argument,
        factory: requestHeaders,
        schema,
      };
      const parameters: SwaggerSchema[] = getMetadata(API_PARAMETERS_METADATA, handler) ?? [];
      const parameter = { name: undefined, required: true, in: 'header', standardSchema: schema };
      defineMetadata(API_PARAMETERS_METADATA, [...parameters, parameter], handler);
    }
  }

  defineMetadata(ROUTE_ARGS_METADATA, routeArguments, controller, method);
};

export const isDtoClass = (value: unknown): value is DtoClass<StandardSchemaV1> =>
  typeof value === 'function' && 'schema' in value && isStandardSchema(value.schema);

export const isSchemaReference = (value: unknown): value is SchemaReference =>
  typeof value === 'object' && value !== null && 'schema' in value && isStandardSchema(value.schema);

const isStandardSchema = (value: unknown): value is StandardSchemaV1 =>
  (typeof value === 'object' || typeof value === 'function') && value !== null && '~standard' in value;

export const toSchemaReference = (
  dto: DtoClass<StandardSchemaV1>,
  { reference }: { reference: boolean },
): SchemaReference => ({
  '~standard': dto.schema['~standard'],
  schema: dto.schema,
  name: reference ? dto.name : undefined,
});

const requestHeaders = (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest().headers;

export const registerSwaggerSchemas = (handler: object) => {
  for (const key of [API_PARAMETERS_METADATA, API_RESPONSE_METADATA]) {
    const entries: SwaggerSchema[] = Object.values(getMetadata(key, handler) ?? {});
    for (const entry of entries) {
      if (entry.standardSchema === undefined && isDtoClass(entry.type)) {
        entry.standardSchema = toSchemaReference(entry.type, {
          reference: entry.in === undefined || entry.in === 'body',
        });
      }
    }
  }
};

export const patchOpenApiParameter = <T extends Parameter>(parameter: T): T => {
  if (!parameter.schema || typeof parameter.schema !== 'object') {
    return parameter;
  }

  const { schema: originalSchema, ...rest } = parameter;
  const schema = { ...originalSchema } as JsonSchema;
  if (schema.description === parameter.description) {
    delete schema.description;
  }

  const promoted: JsonSchema = {};
  for (const key of Object.keys(schema)) {
    if (!(key === 'deprecated' || key.startsWith('x-'))) {
      continue;
    }

    promoted[key] = schema[key];
    delete schema[key];
  }

  return { ...rest, ...promoted, schema } as T;
};

export const convert = ({ schema, name }: SchemaReference) => {
  if (!hasJsonSchema(schema)) {
    return;
  }

  const jsonSchema = schema['~standard'].jsonSchema.input({ target: 'draft-2020-12' });
  const { id, root, definitions } = inlineRoot(jsonSchema);
  const componentName = name && (id ?? name);
  const schemas = componentName ? { ...definitions, [componentName]: root } : definitions;
  return {
    schema: componentName ? { $ref: `#/components/schemas/${componentName}` } : normalize(root),
    components: normalize(schemas) as Record<string, SchemaObject>,
  };
};

const hasJsonSchema = (schema: StandardSchemaV1): schema is StandardSchemaV1 & StandardJSONSchemaV1 =>
  'jsonSchema' in schema['~standard'];

const inlineRoot = ({ $defs: definitions = {}, $schema: _, ...root }: GeneratedJsonSchema) => {
  if (typeof root.$ref !== 'string') {
    return { id: undefined, root, definitions };
  }

  const id = root.$ref.replace('#/$defs/', '');
  const { [id]: rootDefinition, ...rest } = definitions;
  return { id, root: rootDefinition, definitions: rest };
};

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const result = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === '$ref' ? String(item).replace('#/$defs/', '#/components/schemas/') : normalize(item),
    ]),
  );
  return normalizeNullable(result);
};

const normalizeNullable = (schema: JsonSchema) => {
  const { anyOf, ...rest } = schema;
  const value = getNullableValue(anyOf);
  if (!value) {
    return schema;
  }

  // TODO: remove once https://github.com/OpenAPITools/openapi-generator/pull/25074 is released;
  // until then the generator leaks descriptions and nullability between identical inline anyOf branches
  if (isTypeListNullable(value)) {
    return { ...value, ...rest, type: [value.type, 'null'] };
  }

  const { description, ...valueRest } = value;
  return description === undefined ? schema : { description, ...rest, anyOf: [valueRest, { type: 'null' }] };
};

const getNullableValue = (anyOf: unknown) => {
  if (!Array.isArray(anyOf) || anyOf.length !== 2) {
    return;
  }

  const branches = anyOf as JsonSchema[];
  return branches.some((branch) => branch.type === 'null')
    ? branches.find((branch) => branch.type !== 'null')
    : undefined;
};

const isTypeListNullable = (schema: JsonSchema) =>
  TYPE_LIST_NULLABLE_TYPES.has(String(schema.type)) &&
  Object.keys(schema).every((key) => !COMPOSITE_SCHEMA_KEYWORDS.has(key));
