# Infrastructure Layer Guidelines (src/infrastructure)

**技術的詳細と外部システムへのアダプター。**
Domain層のインターフェースを実装する場所。

## ディレクトリ構成

- `database/`: DBクライアントの初期化 (e.g. `supabaseClient.ts`)。
- `repositories/`: `domain/repositories` の実装クラス (e.g. `SupabaseUserRepository`)。
- `external/`: 外部APIとの通信 (e.g. `StripeAdapter`, `GeminiClient`)。

## ルール

- **Adapter Pattern:** Domain層のInterfaceに適合させる形で実装する。
- **Isolation:** ここでの変更がDomain層に波及しないようにする。
