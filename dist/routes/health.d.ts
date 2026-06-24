import { Hono } from 'hono';
import type { AppEnv } from 'postgrestjs/api/types';
declare const router: Hono<AppEnv, import("hono/types").BlankSchema, "/">;
export default router;
