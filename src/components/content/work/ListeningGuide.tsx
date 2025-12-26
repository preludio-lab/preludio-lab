export const ListeningGuide = () => {
    const items = [
        { time: '00:00', label: 'Opening Arpeggios', active: false },
        { time: '01:15', label: 'Climax (crescendo)', active: true },
        { time: '01:45', label: 'Final C Major Chord', active: false },
    ];

    return (
        <div className="bg-neutral-50 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-lg mb-4 text-primary">Listening Guide</h3>
            <ul className="space-y-3 font-mono text-sm">
                {items.map((item, index) => (
                    <li key={index} className="flex gap-4">
                        <span className="text-neutral-500">[{item.time}]</span>
                        <span className={`cursor-pointer hover:underline ${item.active ? 'text-blue-600 font-medium' : 'text-blue-500'}`}>
                            {item.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
