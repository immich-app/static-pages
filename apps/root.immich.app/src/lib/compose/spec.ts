import type { Compose } from '@json-types/compose';

export type { Service as ComposeService } from '@json-types/compose';

// The generated Volume type omits the null the compose schema allows for a default volume.
export type ComposeFile = Omit<Compose, 'volumes'> & { volumes?: Record<string, null> };

export type YamlPath = (string | number)[];

export type FieldPaths = Record<string, YamlPath[]>;
