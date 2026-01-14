import { describe, it, expect, vi } from 'vitest'
import app from './index'

describe('CDN Proxy Worker', () => {
    it('should return 200 for health check', async () => {
        const res = await app.request('/')
        expect(res.status).toBe(200)
        expect(await res.text()).toBe('PreludioLab CDN Proxy is active.')
    })

    it('should return 404 if object not found in R2', async () => {
        const mockR2 = {
            get: vi.fn().mockResolvedValue(null)
        }
        const res = await app.request('/audio/test.mp3', {}, { R2_BUCKET: mockR2 })
        expect(res.status).toBe(404)
    })

    it('should return 200 and content from R2', async () => {
        const mockBody = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('mock audio content'))
                controller.close()
            }
        })
        const mockR2 = {
            get: vi.fn().mockResolvedValue({
                body: mockBody,
                httpEtag: 'test-etag',
                writeHttpMetadata: (headers: Headers) => {
                    headers.set('Content-Type', 'audio/mpeg')
                },
                range: null
            })
        }
        const res = await app.request('/audio/test.mp3', {}, { R2_BUCKET: mockR2 })
        expect(res.status).toBe(200)
        expect(res.headers.get('Content-Type')).toBe('audio/mpeg')
        expect(res.headers.get('Cache-Control')).toContain('immutable')
    })

    it('should handle Range Requests and return 206', async () => {
        const mockR2 = {
            get: vi.fn().mockResolvedValue({
                body: new ReadableStream(),
                httpEtag: 'test-etag',
                writeHttpMetadata: () => { },
                range: { offset: 0, length: 100 }
            })
        }
        const res = await app.request('/audio/test.mp3', {
            headers: { range: 'bytes=0-99' }
        }, { R2_BUCKET: mockR2 })
        expect(res.status).toBe(206)
    })
})
