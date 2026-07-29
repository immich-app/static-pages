import type { AutoRouterType, IRequest } from 'itty-router';

export type AppRouter = AutoRouterType<IRequest, [Env, ExecutionContext]>;
