/**
 * ArticleListeningGuide
 * 記事詳細ページで使用するリスニングガイド。
 * 現時点ではモックとして実装。将来的にPlaybackデータと連動予定。
 */
export function ArticleListeningGuide() {
  const items = [
    { time: '00:00', label: 'Opening Arpeggios' },
    { time: '01:15', label: 'Climax (crescendo)' },
    { time: '01:45', label: 'Final C Major Chord' },
  ];

  return (
    <div className="bg-neutral-50 rounded-2xl p-8 mb-6 shadow-sm">
      <h3 className="font-bold text-2xl mb-6 text-black">Listening Guide</h3>
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="flex gap-4 items-center">
            <span className="font-mono text-gray-500 text-lg">[{item.time}]</span>
            <span className="text-lg text-blue-500 hover:underline cursor-pointer">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
