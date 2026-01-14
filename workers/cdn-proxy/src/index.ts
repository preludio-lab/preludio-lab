import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
    R2_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定 - 本番環境ではプロジェクトドメインに制限
app.use('*', cors({
    origin: ['https://preludiolab.com', 'https://www.preludiolab.com', 'http://localhost:3000'],
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    exposeHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    maxAge: 86400,
}))

app.get('/:type/:file{.+}', async (c) => {
    const { type, file } = c.req.param()

    // マッピングロジック: /{type}/{file} -> public/{type}/{file}
    // これにより、'public' ディレクトリ内のアセットのみを配信することを保証します
    const key = `public/${type}/${file}`

    // デバッグログ: リクエストされたファイル
    console.log(`[CDN] Requesting: ${key}`)

    try {
        // 最小構成: Range指定なしでオブジェクトを全取得
        const object = await c.env.R2_BUCKET.get(key)

        if (!object) {
            console.warn(`[CDN] Not Found: ${key}`)
            return c.text('Not Found', 404)
        }

        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)

        // 基本的なセキュリティヘッダー
        headers.set('X-Content-Type-Options', 'nosniff')
        headers.set('Access-Origin-Resource-Policy', 'same-site')

        // Content-Typeの明示
        if (key.endsWith('.svg')) {
            headers.set('Content-Type', 'image/svg+xml')
        } else if (key.endsWith('.mp3')) {
            headers.set('Content-Type', 'audio/mpeg')
        }

        // キャッシュ戦略
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')

        if (!object.body) {
            console.warn(`[CDN] No Body for: ${key}`)
            return c.body(null, 204)
        }

        console.log(`[CDN] Serving (Full): ${key}, Type: ${headers.get('Content-Type')}`)

        return new Response(object.body, {
            headers,
            status: 200,
        })
    } catch (e) {
        console.error(`[CDN] Critical Error:`, e)
        return c.text('Internal Server Error', 500)
    }
})

// オプション: ヘルスチェックまたはルートルート
app.get('/', (c) => c.text('PreludioLab CDN Proxy is active.'))

export default app
