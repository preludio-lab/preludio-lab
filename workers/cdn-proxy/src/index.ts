import { Hono } from 'hono';

const app = new Hono();

app.get('/*', async (c) => {
  const url = new URL(c.req.url);
  const file = url.pathname.slice(1);

  if (!file) {
    return c.text('Not Found', 404);
  }

  const key = `public/${file}`;
  // eslint-disable-next-line no-console
  console.log(`[CDN] Requesting: ${key}`);

  try {
    const object = await (
      c.env as { BUCKET: { get: (k: string) => Promise<{ body: ReadableStream }> } }
    ).BUCKET.get(key);

    if (!object) {
      // eslint-disable-next-line no-console
      console.warn(`[CDN] Not Found: ${key}`);
      return c.text('Not Found', 404);
    }

    return c.body(object.body);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[CDN] Critical Error:`, e);
    return c.text('Internal Server Error', 500);
  }
});

export default app;
