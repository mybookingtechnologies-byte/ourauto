interface Point {
  day: string;
  views: number;
}

export function PerformanceGraph({ points }: { points: Point[] }) {
  const max = Math.max(...points.map((item) => item.views), 1);

  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-semibold">Performance Graph</h2>
      <div className="flex items-end gap-2">
        {points.map((point) => (
          <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-accent"
              style={{ height: `${Math.max(10, (point.views / max) * 140)}px` }}
              aria-label={`${point.day} ${point.views}`}
            />
            <span className="text-xs text-muted">{point.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}