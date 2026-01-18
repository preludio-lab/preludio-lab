import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  R2_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS設定
app.use(
  '*',
  cors({
    origin: ['https://preludiolab.com', 'https://www.preludiolab.com', 'http://localhost:3000'],
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    exposeHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'ETag'],
    maxAge: 86400,
  }),
);

// ヘルスチェックまたールートルート
app.get('/', (c) => c.text('PreludioLab CDN Proxy is active.'));

app.get('/*', async (c) => {
  const file = c.req.path.slice(1); // Remove leading slash

  // パス・トラバーサル対策
  if (file.includes('..')) {
    return c.text('Invalid Path', 400);
  }

  const key = `public/${file}`;
  console.log(`[CDN] Requesting: ${key}`);

  try {
    const rangeHeader = c.req.header('Range');
    const r2Options: R2GetOptions = {};

    // Rangeヘッダーの簡易パース
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace('bytes=', '').split('-');
      if (parts[0] === '' && parts[1]) {
        r2Options.range = { suffix: parseInt(parts[1], 10) };
      } else if (parts[0] !== '') {
        const offset = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : undefined;
        if (end !== undefined) {
          r2Options.range = { offset, length: end - offset + 1 };
        } else {
          r2Options.range = { offset };
        }
      }
    }

    const object = await c.env.R2_BUCKET.get(key, r2Options);

    if (!object) {
      console.warn(`[CDN] Not Found: ${key}`);
      return c.text('Not Found', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // MIME Type: R2のメタデータを優先し、なければ拡張子判定
    if (!headers.has('content-type')) {
      if (key.endsWith('.svg')) headers.set('Content-Type', 'image/svg+xml');
      else if (key.endsWith('.mp3')) headers.set('Content-Type', 'audio/mpeg');
    }

    // セキュリティ & キャッシュ
    headers.set('X-Content-Type-Options', 'nosniff');

    // CORP設定: localhost:3000 からのアクセスのみ緩和し、それ以外は厳格な same-site とする
    const origin = c.req.header('Origin');
    if (origin === 'http://localhost:3000') {
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    } else {
      headers.set('Cross-Origin-Resource-Policy', 'same-site');
    }

    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Accept-Ranges', 'bytes');

    // レスポンスの構築
    if (object.range) {
      // Partial Content (206)
      // R2Range is either { offset: number; length?: number } or { suffix: number }
      const range = object.range as { offset?: number; length?: number; suffix?: number };

      let rangeStart: number;
      let rangeEnd: number;

      if (range.suffix !== undefined) {
        rangeStart = object.size - range.suffix;
        rangeEnd = object.size - 1;
      } else {
        rangeStart = range.offset ?? 0;
        rangeEnd = (range.offset ?? 0) + (range.length ?? object.size - (range.offset ?? 0)) - 1;
      }

      headers.set('Content-Range', `bytes ${rangeStart}-${rangeEnd}/${object.size}`);
      headers.set('Content-Length', (rangeEnd - rangeStart + 1).toString());

      return new Response(object.body as ReadableStream, {
        headers,
        status: 206,
      });
    } else {
      // Full Content (200)
      headers.set('Content-Length', object.size.toString());

      return new Response(object.body as ReadableStream, {
        headers,
        status: 200,
      });
    }
  } catch (e) {
    console.error(`[CDN] Critical Error:`, e);
    return c.text('Internal Server Error', 500);
  }
});

export default app;
