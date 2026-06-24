import { Hono } from 'hono';
import type { AppEnv } from 'postgrestjs/api/types';

const router = new Hono<AppEnv>();
router.get('/', (c) => c.json({ ok: true }));
export default router;
