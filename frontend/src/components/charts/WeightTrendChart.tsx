type Point = { label: string; value: number };

const seedPoints: Point[] = [
  { label: "Jul 01", value: 73.8 }, { label: "Jul 03", value: 73.5 }, { label: "Jul 05", value: 73.4 },
  { label: "Jul 07", value: 73.0 }, { label: "Jul 09", value: 72.9 }, { label: "Jul 11", value: 72.6 },
  { label: "Jul 13", value: 72.4 }, { label: "Today", value: 72.4 },
];

export function WeightTrendChart({ points = seedPoints }: { points?: Point[] }) {
  const width = 760;
  const height = 220;
  const left = 36;
  const right = 12;
  const top = 16;
  const bottom = 35;
  const min = Math.floor(Math.min(...points.map((point) => point.value)) - .35);
  const max = Math.ceil(Math.max(...points.map((point) => point.value)) + .35);
  const x = (index: number) => left + (index * (width - left - right)) / Math.max(points.length - 1, 1);
  const y = (value: number) => top + ((max - value) * (height - top - bottom)) / Math.max(max - min, 1);
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const area = `${left},${height - bottom} ${line} ${x(points.length - 1)},${height - bottom}`;
  const ticks = [max, Math.round((max + min) / 2), min];

  return <div className="chart-wrap" role="img" aria-label="Weight trend chart showing a gradual decrease to 72.4 kilograms">
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs><linearGradient id="weight-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2f9e44" stopOpacity=".18" /><stop offset="1" stopColor="#2f9e44" stopOpacity="0" /></linearGradient></defs>
      {ticks.map((tick) => <g key={tick}><line className="chart-grid-line" x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} /><text className="chart-axis" x="0" y={y(tick) + 3}>{tick} kg</text></g>)}
      <polygon points={area} fill="url(#weight-area)" />
      <polyline points={line} fill="none" stroke="#2f9e44" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {points.map((point, index) => <g key={`${point.label}-${point.value}`}><circle cx={x(index)} cy={y(point.value)} r="4" fill="#fff" stroke="#2f9e44" strokeWidth="2" /><text className="chart-axis" textAnchor="middle" x={x(index)} y={height - 11}>{point.label}</text></g>)}
    </svg>
  </div>;
}
