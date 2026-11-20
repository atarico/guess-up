import { createApp } from './app.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const app = createApp({ corsOrigins: env.corsOrigins });

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
