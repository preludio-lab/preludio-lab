/**
 * @google/generative-ai SDK の型定義拡張
 *
 * SDK v0.24.x の公開型定義 (RequestOptions) に `customFetch` プロパティが
 * 含まれていないため、Declaration Merging で型を拡張します。
 * ランタイムでは customFetch が正常に機能することが確認済みです。
 *
 * @see https://github.com/google/generative-ai-js
 */

import '@google/generative-ai';

declare module '@google/generative-ai' {
  interface RequestOptions {
    /**
     * カスタム fetch 関数。リトライやタイムアウトなどを組み込む際に使用します。
     * SDK v0.24.x ではランタイムでサポートされていますが、型定義に含まれていません。
     */
    customFetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
  }
}
