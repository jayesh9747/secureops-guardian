import { z } from 'zod';

import { createFixtureMcpApp } from './app.js';

const host = process.env.HOST ?? '127.0.0.1';
const port = z.coerce
  .number()
  .int()
  .min(1)
  .max(65_535)
  .parse(process.env.PORT ?? '8788');

const app = createFixtureMcpApp(host);

app.listen(port, host, () => {
  console.log(`Guardian Fixture MCP listening at http://${host}:${port}/mcp`);
});
