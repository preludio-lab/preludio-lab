import { Hono } from 'hono';

// Cloudflare Workers の基本的な型補完のための最低限の定義
interface R2Object {
  body: ReadableStream;
  httpEtag: string;
  range?: { offset: number; length: number };
  writeHttpMetadata(headers: Headers): void;
}

interface R2Bucket {
  get(
    key: string,
    options?: { range?: string | { offset: number; length: number } },
  ): Promise<R2Object | null>;
}

const app = new Hono<{ Bindings: { R2_BUCKET: R2Bucket } }>();

// Health check
app.get('/', (c) => c.text('PreludioLab CDN Proxy is active.'));

// R2 Proxy
app.get('/*', async (c) => {
  const url = new URL(c.req.url);
  const file = url.pathname.slice(1);

  if (!file) {
    return c.text('Not Found', 404);
  }

  const key = `public/${file}`;
  const range = c.req.header('range');

  // eslint-disable-next-line no-console
  console.log(`[CDN] Requesting: ${key} (Range: ${range || 'none'})`);

  try {
    const object = await c.env.R2_BUCKET.get(key, {
      range: range || undefined,
    });

    if (!object) {
      // eslint-disable-next-line no-console
      console.warn(`[CDN] Not Found: ${key}`);
      return c.text('Not Found', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // Cache Control (Immutable for CDN)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    const status = object.range ? 206 : 200;

    return c.body(object.body, status, Object.fromEntries(headers.entries()));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[CDN] Critical Error:`, e);
    return c.text('Internal Server Error', 500);
  }
});

export default app;
