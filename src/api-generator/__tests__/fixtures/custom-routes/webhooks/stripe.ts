import { Hono } from 'hono';
import type { AppEnv } from '../../../../../api/types.js';

const router = new Hono<AppEnv>();
router.post('/', (c) => c.json({ received: true }));
export default router;
