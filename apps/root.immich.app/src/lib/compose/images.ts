export const IMAGES = {
  server: (version: string) => `ghcr.io/immich-app/immich-server:${version}`,
  machineLearning: (version: string) => `ghcr.io/immich-app/immich-machine-learning:${version}`,
  redis: 'docker.io/valkey/valkey:9@sha256:3add1a336a920ea54770a001ab6feb3da5fceea96a40373a3a2cd469b815f0b7',
  database:
    'ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0@sha256:bcf63357191b76a916ae5eb93464d65c07511da41e3bf7a8416db519b40b1c23',
};
