export default function TimelineRuler({ baseTime, endTime, fullWidth }) {
  if (!baseTime || !endTime) return null;

  const tickInterval = 3600000; // 1 hour
  const ticks = [];

  for (let t = baseTime; t <= endTime + tickInterval; t += tickInterval) {
    const left = Math.round(((t - baseTime) / (endTime - baseTime)) * fullWidth);
    ticks.push(Math.round((t - baseTime)));
  }

  return (
    <div className="timeline-ruler">
      {ticks.map((tick, idx) => (
        <div key={idx} className="ruler-tick" style={{ left: '${tick.left}px' }}>
        </div>
      ))}
    </div>
  );
}