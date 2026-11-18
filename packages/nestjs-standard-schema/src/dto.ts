import { Type } from '@nestjs/common';
import { OpenAPIObject, StandardSchemaConverter } from '@nestjs/swagger';
import { StandardSchemaV1 } from '@standard-schema/spec';
import {
  convert,
  isDtoClass,
  isSchemaReference,
  Parameter,
  patchOpenApiParameter,
  registerRouteArguments,
  registerSwaggerSchemas,
  SchemaObject,
  toSchemaReference,
} from 'src/utils.js';

export type DtoClass<S extends StandardSchemaV1> = {
  new (): StandardSchemaV1.InferOutput<S>;
  readonly schema: S;
};

export const createStandardSchemaDto = <T extends StandardSchemaV1>(schema: T): DtoClass<T> =>
  class {
    static readonly schema = schema;
  } as unknown as DtoClass<T>;

export const registerSchemas = ({ controllers }: { controllers: Type[] }) => {
  for (const controller of controllers) {
    const prototype = controller.prototype as Record<string, unknown>;
    for (const method of Object.getOwnPropertyNames(prototype)) {
      const handler = prototype[method];
      if (method === 'constructor' || typeof handler !== 'function') {
        continue;
      }

      registerRouteArguments(controller, method, handler);
      registerSwaggerSchemas(handler);
    }
  }
};

export const toOpenApiSchema: StandardSchemaConverter = (value) =>
  isSchemaReference(value) ? convert(value) : undefined;

export const toOpenApiComponents = (models: unknown[]) => {
  const components: Record<string, SchemaObject> = {};
  for (const model of models) {
    if (isDtoClass(model)) {
      Object.assign(components, convert(toSchemaReference(model, { reference: true }))?.components);
    }
  }

  return components;
};

export const patchOpenApiParameters = (document: OpenAPIObject) => {
  for (const path of Object.values(document.paths)) {
    for (const operation of Object.values(path)) {
      if (!(typeof operation === 'object' && 'parameters' in operation && Array.isArray(operation.parameters))) {
        continue;
      }

      const parameters = operation.parameters as Parameter[];
      operation.parameters = parameters.map((parameter) => patchOpenApiParameter(parameter));
    }
  }
};
