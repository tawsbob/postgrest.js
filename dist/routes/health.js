import { Hono } from 'hono';
const router = new Hono();
router.get('/', (c) => c.json({ ok: true }));
export default router;
