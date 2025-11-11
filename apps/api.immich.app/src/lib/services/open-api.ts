import type { Pathname } from '$app/types';
import { PUBLIC_IMMICH_SPEC_URL } from '$env/static/public';
import { ApiPage } from '$lib';
import type {
  OpenAPIObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from '$lib/services/open-api.d';

export type ApiMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH';
export type AuthenticationMethod = 'ApiKey' | 'Cookie' | 'Bearer';

type Linkable<T> = T & {
  href: Pathname;
  name: string;
  previous?: Linkable<T>;
  next?: Linkable<T>;
};

export type ApiModel = Linkable<SchemaObject>;
export type ApiEndpointTag = Linkable<{
  endpoints: Linkable<ApiEndpoint>[];
  description?: string;
}>;
export type ApiEndpoint = {
  name: string;
  method: ApiMethod;
  route: string;
  operationId: string;
  description?: string;
  deprecated?: boolean;
  adminRoute?: boolean;
  sharedLinkRoute?: boolean;
  publicRoute?: boolean;
  summary?: string;
  tags: string[];
  authentication: AuthenticationMethod[];
  permission?: string;
  params: ParameterObject[];
  queryParams: ParameterObject[];
  requestBody?: ReferenceObject;
  responses: ApiEndpointResponse[];
};
type ApiEndpointResponse = {
  status: number;
  description?: string;
  contentType?: string;
  content?: string;
  schema?: ReferenceObject | SchemaObject;
};

const isParameterObject =
  (type: string) =>
  (param: unknown): param is ParameterObject =>
    (param as ParameterObject).in === type;

const asSlug = (tag: string) => tag.toLowerCase().replace(/\s/g, '-');
const getModelHref = (model: string) => `${ApiPage.Models}/${model}` as Pathname;
const getTagHref = (tag: string) => `${ApiPage.Endpoints}/${asSlug(tag)}` as Pathname;

export const getRefName = (ref: ReferenceObject) => ref.$ref.replace('#/components/schemas/', '');
export const getRefHref = (ref: ReferenceObject) => getModelHref(getRefName(ref));
export const isRef = (ref: unknown): ref is ReferenceObject => ref instanceof Object && '$ref' in ref;

const methodColor: Partial<Record<ApiMethod, string>> = {
  GET: 'text-success',
  POST: 'text-info',
  PUT: 'text-warning',
  PATCH: 'text-warning',
  DELETE: 'text-danger',
};
export const getEndpointColor = (endpoint: ApiEndpoint) =>
  endpoint.deprecated ? '' : (methodColor[endpoint.method] ?? '');

export const parseSpec = (spec: OpenAPIObject) => {
  const modelsMap: Record<string, ApiModel> = {};
  for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
    // top level schemas are not references
    const model = schema as ApiModel;
    model.name = name;
    model.href = getModelHref(name);
    modelsMap[name] = model;
  }

  const endpointsMap: Record<string, ApiEndpoint> = {};
  for (const [route, methods] of Object.entries(spec.paths)) {
    for (const [method, item] of Object.entries({
      get: methods.get,
      put: methods.put,
      post: methods.post,
      delete: methods.delete,
      options: methods.options,
      head: methods.head,
      patch: methods.patch,
      trace: methods.trace,
    })) {
      if (!item) {
        continue;
      }

      const { description: descriptionRaw, operationId, security, summary, tags } = item;
      const description = descriptionRaw?.replaceAll(/`/g, "'");

      if (!operationId) {
        console.log('Skipping route without an operationId', { route });
        continue;
      }

      const responses: ApiEndpointResponse[] = [];
      for (const [status, response] of Object.entries(item.responses)) {
        if (!response) {
          continue;
        }

        const common: ApiEndpointResponse = { status: Number(status), description };

        if (status === '204') {
          responses.push(common);
          continue;
        }

        if (isRef(response)) {
          responses.push({ ...common, schema: response });
          continue;
        }

        // ignore these for now
        if (typeof response === 'string' || !response.content) {
          continue;
        }

        for (const [contentType, { schema }] of Object.entries(response.content)) {
          if (!schema) {
            continue;
          }

          responses.push({ ...common, description: response?.description, contentType, schema });
        }
      }

      const authentication: AuthenticationMethod[] = [];
      for (const { bearer, cookie, api_key } of security ?? []) {
        authentication.push(bearer && 'Bearer', cookie && 'Cookie', api_key && 'ApiKey');
      }

      const bodyRef = Object.values((item.requestBody as RequestBodyObject)?.content ?? {})[0]?.schema;

      endpointsMap[operationId] = {
        name: operationId || 'unknown',
        authentication: authentication.filter(Boolean),
        responses,
        permission: item['x-immich-permission'],
        deprecated: item.deprecated,
        adminRoute: item['x-immich-admin-only'] ?? false,
        sharedLinkRoute: item.parameters?.some(
          (param) => 'in' in param && param.in === 'query' && (param.name === 'key' || param.name === 'slug'),
        ),
        publicRoute: (item.security || [])?.length === 0,
        requestBody: isRef(bodyRef) ? bodyRef : undefined,
        method: method.toUpperCase() as ApiMethod,
        route,
        operationId,
        params: (item.parameters || []).filter(isParameterObject('path')),
        queryParams: (item.parameters || []).filter(isParameterObject('query')),
        tags: tags ?? [],
        description,
        summary,
      };
    }
  }

  const addTag = (tag: { name: string; description?: string }) => {
    if (!tagsMap[tag.name]) {
      tagsMap[tag.name] = {
        href: getTagHref(tag.name),
        name: tag.name,
        description: tag.description,
        endpoints: [],
      };
    }
  };

  const tagsMap: Record<string, ApiEndpointTag> = {};
  for (const { name, description } of Object.values(spec.tags ?? [])) {
    addTag({ name, description });
  }

  for (const item of Object.values(endpointsMap)) {
    for (const tag of item.tags) {
      if (!tagsMap[tag]) {
        addTag({ name: tag });
      }

      const endpointHref = `${tagsMap[tag].href}/${item.operationId}` as Pathname;
      tagsMap[tag].endpoints.push({ ...item, href: endpointHref });
    }
  }

  const tags = Object.keys(tagsMap)
    .toSorted()
    .map((tag) => tagsMap[tag]);

  let previousTag: Linkable<ApiEndpointTag> | undefined;
  let previousEndpoint: Linkable<ApiEndpoint> | undefined;
  for (const tag of tags) {
    if (previousTag) {
      tag.previous = previousTag;
      previousTag.next = tag;
    }

    for (const endpoint of tag.endpoints) {
      endpoint.previous = previousEndpoint;
      if (previousEndpoint) {
        previousEndpoint.next = endpoint;
      }

      previousEndpoint = endpoint;
    }

    previousTag = tag;
  }

  return {
    info: spec.info,
    // modelsMap,
    models: Object.keys(modelsMap)
      .toSorted()
      .map((model) => modelsMap[model]),
    // endpointsMap,
    // endpoints: Object.keys(endpointsMap)
    //   .toSorted()
    //   .map((endpoint) => endpointsMap[endpoint]),
    // tagsMap,
    tags,

    endpoints: Object.keys(endpointsMap)
      .toSorted()
      .map((endpoint) => endpointsMap[endpoint]),

    fromRef: (ref: ReferenceObject) => {
      const name = getRefName(ref);
      const item = modelsMap[name];
      if (item) {
        return item;
      }

      console.log('Unable to resolve schema from $ref', ref);
    },
  };
};

let openApi: ReturnType<typeof parseSpec> | undefined;

type Fetch = typeof fetch;
export const loadOpenApi = async (fetch: Fetch) => {
  if (!openApi) {
    const url = PUBLIC_IMMICH_SPEC_URL;
    console.log(`Loading open-api from ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load url: ${url}. Received status: ${response.status}`);
    }

    const spec = (await response.json()) as unknown as OpenAPIObject;

    openApi = parseSpec(spec);
  }

  return () => openApi;
};

export const getOpenApi = () => {
  if (!openApi) {
    throw new Error('API not loaded');
  }

  return openApi;
};
