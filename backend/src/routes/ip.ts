import { Router } from 'express';

/**
 * TEMPORARY, removed in work unit 3 once TRUST_PROXY_HOPS is measured on Render (02 §4).
 * One visit shows who Express thinks the client is and the raw chain the proxies built.
 * When the leftmost forwarded address is the visitor's own IP, the number of addresses is
 * the number of hops to trust.
 */
export function ipRouter() {
  const router = Router();
  router.get('/ip', (req, res) => {
    const forwardedFor = req.get('x-forwarded-for') ?? null;
    const forwardedCount = forwardedFor ? forwardedFor.split(',').filter((address) => address.trim() !== '').length : 0;
    res.json({ ip: req.ip, forwardedFor, forwardedCount });
  });
  return router;
}
