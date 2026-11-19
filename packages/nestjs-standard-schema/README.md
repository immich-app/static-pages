# @immich/nestjs-standard-schema

[Standard Schema](https://standardschema.dev) validators as NestJS DTOs. Write a class from a schema, use it in a
controller like any other DTO, and it gets validated and documented in the OpenAPI spec. Zod gets a few extras on
top, like passing a shape directly and naming components with `.meta({ id })`.

It started as a replacement for the [`nestjs-zod`](https://www.npmjs.com/package/nestjs-zod) package in Immich and
is a lot smaller, since it builds on the standard schema support in NestJS 12. It also works with `@Headers()`, which
the original package doesn't support.

## Install

```bash
pnpm i @immich/nestjs-standard-schema
```

It needs `@nestjs/common` and `@nestjs/swagger` 12 or newer, and `reflect-metadata` 0.2 or newer. Zod is optional
and only needed for the helpers in `@immich/nestjs-standard-schema/zod`, which require Zod 4.2 or newer.

## Usage

```ts
import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';

const AlbumCreateSchema = z.object({
  name: z.string().describe('Album name'),
  description: z.string().optional(),
});

export class AlbumCreateDto extends createZodDto(AlbumCreateSchema) {}
```

For a plain object you can skip `z.object` and pass the shape directly:

```ts
export class AlbumCreateDto extends createZodDto({
  name: z.string().describe('Album name'),
  description: z.string().optional(),
}) {}
```

Instances are typed as the schema output, and the schema is on the class as `AlbumCreateDto.schema`. When it was
created from a shape, that's the `z.object` built from it.

```ts
@Controller('albums')
class AlbumController {
  @Post()
  @ApiResponse({ status: 201, type: AlbumResponseDto })
  createAlbum(@Body() dto: AlbumCreateDto): Promise<AlbumResponseDto> {
    // ...
  }
}
```

### Other libraries

Any schema that implements Standard Schema works with `createStandardSchemaDto`:

```ts
import { createStandardSchemaDto } from '@immich/nestjs-standard-schema';
import { type } from 'arktype';

export class AlbumCreateDto extends createStandardSchemaDto(type({ name: 'string', 'description?': 'string' })) {}
```

To show up in the OpenAPI spec, the schema also has to implement
[Standard JSON Schema](https://standardschema.dev/json-schema). Schemas that don't are still validated, they're just
left out of the spec.

## Setup

### 1. Register the controllers

`registerSchemas` walks every route on the given controllers and points each DTO argument at its schema. It has to
run before Nest builds the router, so a static block on the module is a good place for it.

```ts
import { registerSchemas } from '@immich/nestjs-standard-schema';

@Module({ controllers })
export class ApiModule {
  static {
    registerSchemas({ controllers });
  }
}
```

### 2. Validation pipe

Validation itself is done by Nest's `StandardSchemaValidationPipe`. `validateCustomDecorators` is needed for
`@Headers()`, since header DTOs are turned into a custom argument.

```ts
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

const providers = [
  {
    provide: APP_PIPE,
    useValue: new StandardSchemaValidationPipe({ validateCustomDecorators: true }),
  },
];
```

Pass an `exceptionFactory` if you want to change the error response.

### 3. OpenAPI

```ts
import { patchOpenApiParameters, toOpenApiComponents, toOpenApiSchema } from '@immich/nestjs-standard-schema';

const document = SwaggerModule.createDocument(app, config, {
  standardSchemaConverter: toOpenApiSchema,
});

document.components = {
  ...document.components,
  schemas: { ...document.components?.schemas, ...toOpenApiComponents(extraModels) },
};

patchOpenApiParameters(document);
```

`toOpenApiComponents` replaces the `extraModels` option for DTOs that aren't used by any route. Anything that isn't a
DTO from this package is skipped, and so is any DTO whose schema can't be turned into JSON Schema.

`patchOpenApiParameters` moves `deprecated` and `x-*` keys from a parameter's schema onto the parameter itself, and
drops descriptions that are repeated on both.

## How DTOs end up in the spec

| Used as                       | Validated | In the spec                                  |
| ----------------------------- | --------- | -------------------------------------------- |
| `@Body()`                     | yes       | `$ref` to a component                        |
| `@Query()`, `@Param()`        | yes       | inlined                                      |
| `@Headers()`                  | yes       | inlined as header parameters                 |
| `@ApiResponse({ type })`      | no        | `$ref` to a component                        |
| `@ApiBody`, `@ApiQuery`, etc. | no        | `$ref` for body, inlined for everything else |

Components are named after the class. For Zod schemas, `.meta({ id })` takes precedence, and nested schemas with an
`id` get their own component too:

```ts
const AssetVisibility = z.enum(['archive', 'timeline', 'hidden']).meta({ id: 'AssetVisibility' });

class AssetUpdateDto extends createZodDto(z.object({ visibility: AssetVisibility.optional() })) {}
```

Only `@Headers()` without a key is handled. `@Headers('x-api-key')` still gives you the raw string.

Node lowercases header names, so the keys in a header DTO have to be lowercase too. A key like `xApiKey` or
`X-Api-Key` never matches, and if it's required, every request fails validation.

Responses are only documented, not validated. They're also documented with the schema's input type, same as requests,
so a field with a `.default()` shows up as optional in a response even though it's always there. This will switch to the
output type in a future breaking release.
