import { PUBLIC_IMMICH_SPEC_URL } from '$env/static/public';
import type {
  OpenAPIObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from '$lib/services/open-api';

export type ApiMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH';
export type AuthenticationMethod = 'ApiKey' | 'Cookie' | 'Bearer';

type Linkable<T> = T & { href: string; name: string };
type ApiModel = Linkable<SchemaObject>;
type ApiEndpointTag = Linkable<{ endpoints: ApiEndpoint[] }>;
type ApiEndpoint = {
  name: string;
  method: ApiMethod;
  route: string;
  operationId?: string;
  description?: string;
  summary?: string;
  tags: string[];
  authentication: AuthenticationMethod[];
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
const methodOrder = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'] as ApiMethod[];
const sortByMethod = (a: ApiEndpoint, b: ApiEndpoint) => methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method);
const getModelHref = (model: string) => `/api/models/${model}`;
const getTagHref = (tag: string) => `/api/endpoints/${asSlug(tag)}`;

export const getTagEndpointHref = (tag: ApiEndpointTag, endpoint: ApiEndpoint) =>
  `${getTagHref(tag.name)}#${endpoint.operationId}`;
export const getRefName = (ref: ReferenceObject) => ref.$ref.replace('#/components/schemas/', '');
export const getRefHref = (ref: ReferenceObject) => getModelHref(getRefName(ref));
export const isRef = (ref: unknown): ref is ReferenceObject => ref instanceof Object && '$ref' in ref;

type ParseOptions = {
  getModelHref: (name: string) => string;
  getTagHref: (tag: string) => string;
};

export const parseSpec = (spec: OpenAPIObject, { getModelHref, getTagHref }: ParseOptions) => {
  const modelsMap: Record<string, ApiModel> = {};
  for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
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
    })) {
      if (!item) {
        continue;
      }

      const { description, operationId, security, summary, tags } = item;

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
        requestBody: isRef(bodyRef) ? bodyRef : undefined,
        method: method.toUpperCase() as ApiMethod,
        route,
        operationId,
        params: (item.parameters || []).filter(isParameterObject('path')),
        queryParams: (item.parameters || []).filter(isParameterObject('query')),
        tags: tags ?? [],
        description,
        summary,
      } as ApiEndpoint;
    }
  }

  const tagsMap: Record<string, ApiEndpointTag> = {};
  for (const endpoint of Object.values(endpointsMap)) {
    for (const tag of endpoint.tags) {
      if (!tagsMap[tag]) {
        tagsMap[tag] = {
          href: getTagHref(tag),
          name: tag,
          endpoints: [],
        };
      }

      tagsMap[tag].endpoints.push(endpoint);
    }
  }

  for (const tag of Object.values(tagsMap)) {
    tag.endpoints.sort(sortByMethod);
  }

  return {
    info: spec.info,
    modelsMap,
    models: Object.keys(modelsMap)
      .toSorted()
      .map((model) => modelsMap[model]),
    endpointsMap,
    endpoints: Object.keys(endpointsMap)
      .toSorted()
      .map((endpoint) => endpointsMap[endpoint]),
    tagsMap,
    tags: Object.keys(tagsMap)
      .toSorted()
      .map((tag) => tagsMap[tag]),

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
    console.log(`Loading open-api from ${PUBLIC_IMMICH_SPEC_URL}`);

    const response = await fetch(PUBLIC_IMMICH_SPEC_URL);
    if (!response.ok) {
      throw new Error(`Request returned non-200 (${response.status})`);
    }

    const spec = (await response.json()) as unknown as OpenAPIObject;

    openApi = parseSpec(spec, {
      getModelHref,
      getTagHref,
    });
  }

  return () => openApi;
};

export const getOpenApi = () => {
  if (!openApi) {
    throw new Error('API not loaded');
  }

  return openApi;
};
