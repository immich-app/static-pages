export const IMAGES = {
  server: (version: string) => `ghcr.io/immich-app/immich-server:${version}`,
  machineLearning: (version: string) => `ghcr.io/immich-app/immich-machine-learning:${version}`,
  redis: 'docker.io/valkey/valkey:9@sha256:4963247afc4cd33c7d3b2d2816b9f7f8eeebab148d29056c2ca4d7cbc966f2d9',
  database:
    'ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0@sha256:bcf63357191b76a916ae5eb93464d65c07511da41e3bf7a8416db519b40b1c23',
};
