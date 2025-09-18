export default function TimelineRuler({ baseTime, endTime, fullWidth }) {
	if (!baseTime || !endTime) return null;

	const tickInterval = 3600000; // 1 hour
	const ticks = [];
	const span = Math.max(1, endTime - baseTime);
	for (let t = baseTime; t <= endTime; t += tickInterval) {
		const left = Math.round(((t - baseTime) / span) * fullWidth);
		ticks.push({ left, t });
	}

	return (
		<div className="timeline-ruler">
			{ticks.map((tick, idx) => (
				<div key={idx} className="ruler-tick" style={{ left: `${tick.left}px` }}></div>
			))}
		</div>
	);
}
