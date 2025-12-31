export const WorkPlayerPlaceholder = () => {
  return (
    <div className="bg-black text-white rounded-xl p-6 flex flex-col items-center justify-center text-center aspect-video shadow-lg mb-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-12 h-12 mb-3 text-white"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z"
        />
      </svg>
      <div className="font-bold text-lg mb-1">YouTube Player</div>
      <div className="text-xs text-gray-400">Audio Sync Ready</div>
    </div>
  );
};
