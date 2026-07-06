---
authors: [Immich Team]
description: How to migrate from Immich v2 to Immich v3, and what breaking
  changes where introduced as part of Immich v3.
id: 85bf6ab2-95b2-4c67-96b2-5a391e4a5af9
publishedAt: 2026-07-01
slug: v3-migration
title: Migrating to v3
type: post
---

The purpose of this document is to enumerate all the breaking changes that were introduced as part of Immich v3 and provide migration steps when available. For users, there have only been a few environment variables removed. Under the hood we also changed and deleted various API endpoints which are documented below.

:::tip
Looking for the release notes? Read them [here](/blog/v3.0.0-release)

:::

## Breaking changes

This release includes a hefty list of breaking changes, most of which were previously deprecated. This post aims to document, explain, and guide users as they upgrade to `v3`. Found something missing? Let us know and we'll get it fixed.

### Mobile

#### Legacy timeline

The legacy timeline in the mobile app has been removed. If you still experience issues with the new timeline, please open an issue on [GitHub](https://github.com/immich-app/immich/issues/new/choose) so we can take a look.

---

### Environment variables

#### Removed `IMMICH_MACHINE_LEARNING_PING_TIMEOUT`

Use the `machineLearning.availabilityChecks.timeout` system config instead (Admin UI)

#### Removed `MACHINE_LEARNING_PRELOAD__CLIP`

Use the `MACHINE_LEARNING_PRELOAD__CLIP__TEXTUAL` and `MACHINE_LEARNING_PRELOAD__CLIP__VISUAL` environment variables instead

#### Removed `MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION`

Use the `MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION__DETECTION` and `MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION__RECOGNITION` environment variables instead

---

### Machine learning

#### Hardware requirements

A bump in numpy now requires x86 CPUs to be in the x86-64-v2 microarchitecture level or higher. This does _not_ mean AVX is required; virtually every mainstream x86 CPU since 2010 meets the x86-64-v2 baseline.

---

### Database

#### pgvecto.rs

Support for pgvecto.rs has been removed in v3. Using `DB_VECTOR_EXTENSION=pgvecto.rs` now throws an error.

We recommend migrating to VectorChord, which is the successor of pgvecto.rs. For information about how to migrate, you can read the [documentation](https://docs.immich.app/install/upgrading#migrating-to-vectorchord)

---

### OAuth

#### Insecure requests

OAuth http requests now no longer permit insecure requests by default. To keep using insecure requests, set `oauth.allowInsecureRequests` in admin > system config.

#### Issuer URL validation

The `oauth.issuerUrl` system config property was previously only required to be a string. Now, it is required to parse as a valid URL.

---

### Metrics

#### Metric names

Exported metric names have been updated: underscore (`_`) in metric names have been replaced with dot/periods (`.`).

---

### Server jobs

#### Removed `AuditLogCleanup` job

The `AuditLogCleanup` job has been removed.

---

### Error responses

Previous to `v3`, the server used `class-validator` for request validation, but starting with `v3`, the server has migrated to [Zod](https://zod.dev/) and now sends back a different error response object. Additionally, the `correlationId` response property has been migrated to the `X-Correlation-ID` response header.

#### Old structure

```typescript
{
  "message": [
    "[comment] Comment must not be provided when type is not COMMENT"
  ],
  "error": "Bad Request",
  "statusCode": 400,
  "correlationId": "dtw6imvq"
}
```

#### New structure

```typescript
{
  "message": "Validation failed",
  "errors": [
     {
        "path": ["comment"],
        "message": "Comment is required when type is COMMENT",
    },
  ]
}
```

#### Error messages

Some error messages have been updated to avoid leaking resource existence or permission details. For more details see [#28154](https://github.com/immich-app/immich/pull/28154).

---

### Endpoints

#### `POST /assets` / `uploadAsset`

- The `deviceId` and `deviceAssetId` properties of `AssetMediaCreateDto` have been removed.
- The `duration` property must now be a `number` and can be `null` (represents milliseconds)

#### Asset responses / `AssetResponseDto`

Endpoints that return assets have been updated with the following changes:

- The `deviceId` and `deviceAssetId` properties of `AssetResponseDto` have been removed.
- The `duration` property now returns a `number` and can be `null` (represents milliseconds)
- The `unassignedFaces` property has been removed (use `GET /faces` to retrieve asset face information)
- The `people` property has been updated to not include `faces` anymore (use `GET /faces` to retrieve asset face information)
- The `width` and `height` properties have been changed from `number` to `integer`

#### EXIF responses / `ExifResponseDto`

Endpoints that return exif have been updated with the following changes:

- The `exifImageWidth`, `exifImageHeight`, `iso`, and `rating` properties have been changed from `number` to `integer`

#### `GET /albums` / `getAllAlbums`

The query parameters of the `getAllAlbums` endpoint have been updated. `shared` has been renamed to `isShared` and a second parameter `isOwned` has been added. They now function as follows:

| `isOwned` | `isShared` | Result                                                |
| --------- | ---------- | ----------------------------------------------------- |
| —         | —          | All accessible albums (owned + shared-with-me)        |
| `true`    | —          | Only albums owned by the user                         |
| `false`   | —          | Only albums shared with the user                      |
| `true`    | `true`     | Owned albums that have been shared out                |
| `true`    | `false`    | Owned private albums                                  |
| —         | `true`     | All albums involving sharing                          |
| —         | `false`    | Private albums only                                   |
| `false`   | `true`     | Albums shared with the user (same as `isOwned=false`) |
| `false`   | `false`    | Empty (logically impossible)                          |

For more details refer to [#28213](https://github.com/immich-app/immich/pull/28213).

#### Album responses / `AlbumResponseDto`

Endpoints that return albums have been updated with the following changes:

- The `owner`and `ownerId` properties have been removed (moved to `albumUsers` with a role of `owner`)
- The `assets` property has been removed (use `POST /api/search/metadata` instead)

#### `GET /people` / `getAllPeople`

- The `page` and `size` properties have been changed from `number` to `integer`

#### `POST /search/*` / `search*`

Search endpoints have been updated with the following changes:

- The `page` and `size` properties have been changed from `number` to `integer`
- The `rating` property has been changed from `number` to `integer`
- When `visibility` is omitted it now defaults to any visibility (except for `locked`, if the session is not elevated), instead of `timeline` visibility.

#### `PATCH /shared-links/:id` / `updateSharedLink`

- The `changeExpiryTime` property of `SharedLinkEditDto` has been removed (instead send `expiresAt` with a `null` value) 

#### `PUT /system-config` / `updateConfig`

- The `libopus` value of `AudioCodec` has been removed (use `opus` instead)

#### Shared link authentication

Endpoints that require shared link authentication now no longer accept `query.password`. Instead, it should be send as `body.password` in the `POST /shared-links/login` / `sharedLinkLogin` endpoint to login, receive a cookie, and use that with subsequent requests.

#### Add to shared link

Previous to `v3` adding an asset to a shared link (without being logged in) required two API requests: one to upload the asset and another one to add it to the shared link. Now, assets are automatically added to the associated shared link when they are uploaded, removing the need to shared link access to the following APIs, to which the access has been removed:

- `PUT /albums/:id/assets` / `addAssetsToAlbum`
- `PUT /albums/assets` / `addAssetsToAlbums`
- `PUT /shared-links/:id/assets` / `addSharedLinkAssets`

#### Shared link response

The `token` response property of `SharedLinkResponse` has been removed.

#### Empty strings

The following endpoints no longer accept empty strings as a substitute for `null`.

| Endpoint                  | Properties                                               |
| ------------------------- | -------------------------------------------------------- |
| `POST /people`            | `birthDate`, `color`                                     |
| `PUT /people/:id`         | `birthDate`, `color`                                     |
| `POST /search/metadata`   | `city`, `state`, `country`, `make`, `model`, `lensModel` |
| `POST /shared-links`      | `description`, `password`, `slug`                        |
| `PATCH /shared-links/:id` | `description`, `password`, `slug`                        |
| `POST /tags`              | `color`                                                  |
| `PUT /tags/:id`           | `color`                                                  |
| `POST /admin/users`       | `pinCode`                                                |
| `PUT /admin/users/:id`    | `pinCode`                                                |

#### Removed endpoints

- Removed `PUT /assets/:id/original` `replaceAsset`
  - The API Key permission for this endpoint, `asset.replace`, has also been removed.
  - Use `PUT /assets/:id/clone` / `copyAsset` instead.
- Removed `GET /assets/random` / `getRandom`
  - Use `POST /search/random` / `searchRandom` instead.
- Removed `POST /sync/delta-sync` / `getDeltaSync`
- Removed `POST /sync/full-sync` / `getFullSyncForUser`
- Removed `GET /server/theme` / `getTheme`
  - Use `GET /custom.css` instead
- Removed `POST /assets/exists` / `checkExistingAssets`
- Removed `GET /assets/device/:deviceId` / `getAllUserAssetsByDeviceId`
