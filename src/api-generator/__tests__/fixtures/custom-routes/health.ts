import { Hono } from 'hono';
import type { AppEnv } from '../../../../api/types.js';

const router = new Hono<AppEnv>();
router.get('/', (c) => c.json({ ok: true }));
export default router;
