'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

interface LoginFormProps {
  callbackUrl?: string;
  locale: string;
  isDevBypassEnabled: boolean;
}

export function LoginForm({ callbackUrl, locale, isDevBypassEnabled }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  // callbackUrlが安全かどうか（オープンリダイレクト脆弱性の排除）を検証する
  // 1. 相対パス（/で始まる）か
  // 2. 自サイトとオリジンが一致するか
  // どちらかを満たす場合は安全とみなす。それ以外はフォールバック。
  const sanitizeCallbackUrl = (url: string | undefined): string => {
    const fallbackPath = `/${locale}/admin`;
    if (!url) return fallbackPath;

    if (url.startsWith('/')) {
      return url;
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.origin === window.location.origin) {
        return url;
      }
    } catch {
      // Parse error (invalid URL)
    }

    return fallbackPath;
  };

  const handleDevBypass = async () => {
    setIsLoading(true);
    const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

    // Auth.js の Credentials Provider 'dev-bypass' を使用
    await signIn('dev-bypass', {
      dummy: 'bypass',
      callbackUrl: safeCallbackUrl,
    });
    // signInはリダイレクトするため、ローディング状態はそのままにする
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* 開発環境のみ表示するバイパス認証ボタン */}
      {isDevBypassEnabled && (
        <button
          onClick={handleDevBypass}
          disabled={isLoading}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </>
          ) : (
            'Sign in with Dev Bypass'
          )}
        </button>
      )}

      {/* GitHubログインなど他のプロバイダーがあればここに追加 */}

      {!isDevBypassEnabled && (
        <div className="p-4 rounded-lg bg-orange-50 border border-orange-100 text-sm text-orange-800 text-center">
          <p className="font-semibold text-orange-900 mb-1">Authentications are restricted</p>
          <p>Please contact your administrator to access this area.</p>
        </div>
      )}
    </div>
  );
}
