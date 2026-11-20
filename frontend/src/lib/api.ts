export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Not `/health`: EasyPrivacy, which Brave Shields and uBlock Origin apply by default, blocks
// cross-site requests to onrender.com/health (DECISIONS.md). Must match HEALTH_PATH in the backend.
export const HEALTH_PATH = '/status';
