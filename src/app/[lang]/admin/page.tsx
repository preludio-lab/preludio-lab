/**
 * Admin Dashboard Page
 *
 * 管理画面のトップページ（ダッシュボード）
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">Dashboard</h1>
        <p className="text-sm text-admin-text-secondary mt-1">PreludioLab 管理画面へようこそ</p>
      </div>

      {/* 統計カード（将来実装） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="作曲家" count={0} />
        <StatCard title="作品" count={0} />
        <StatCard title="フレーズ" count={0} />
        <StatCard title="記事" count={0} />
      </div>

      {/* 最近の活動（将来実装） */}
      <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
        <h2 className="text-lg font-semibold text-admin-text-primary mb-4">最近の活動</h2>
        <p className="text-sm text-admin-text-secondary">データがありません</p>
      </div>
    </div>
  );
}

/**
 * 統計カードコンポーネント
 */
function StatCard({ title, count }: { title: string; count: number }) {
  return (
    <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
      <h3 className="text-sm font-medium text-admin-text-secondary">{title}</h3>
      <p className="text-3xl font-bold text-admin-text-primary mt-2">{count}</p>
    </div>
  );
}
