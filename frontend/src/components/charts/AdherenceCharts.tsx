type MacroPoint = { label: string; protein: number; carbs: number; fat: number };

export const seedMacroPoints: MacroPoint[] = [
  { label: "Mon", protein: 86, carbs: 92, fat: 78 }, { label: "Tue", protein: 91, carbs: 98, fat: 84 },
  { label: "Wed", protein: 74, carbs: 89, fat: 95 }, { label: "Thu", protein: 82, carbs: 94, fat: 88 },
  { label: "Fri", protein: 96, carbs: 90, fat: 92 }, { label: "Sat", protein: 70, carbs: 84, fat: 76 },
  { label: "Sun", protein: 79, carbs: 97, fat: 91 },
];

export function CalorieAdherenceChart({ values = [96, 88, 102, 93, 97, 82, 95], labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }: { values?: number[]; labels?: string[] }) {
  const width = 760; const height = 220; const left = 36; const right = 12; const top = 18; const bottom = 35;
  const x = (index: number) => left + (index * (width - left - right)) / Math.max(values.length - 1, 1);
  const y = (value: number) => top + ((110 - value) * (height - top - bottom)) / 30;
  const line = values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  return <div className="chart-wrap" role="img" aria-label="Calorie adherence chart showing daily target adherence">
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[80, 95, 110].map((tick) => <g key={tick}><line className="chart-grid-line" x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} /><text className="chart-axis" x="2" y={y(tick) + 3}>{tick}%</text></g>)}
      <line x1={left} x2={width - right} y1={y(100)} y2={y(100)} stroke="#b8dcbc" strokeDasharray="4 4" />
      <polyline points={line} fill="none" stroke="#f0a43c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {values.map((value, index) => <g key={`${labels[index]}-${value}`}><circle cx={x(index)} cy={y(value)} r="4" fill="#fff" stroke="#f0a43c" strokeWidth="2" /><text className="chart-axis" textAnchor="middle" x={x(index)} y={height - 11}>{labels[index]}</text></g>)}
    </svg>
  </div>;
}

export function MacroAdherenceChart({ points = seedMacroPoints }: { points?: MacroPoint[] }) {
  const width = 760; const height = 220; const left = 36; const right = 12; const top = 18; const bottom = 35;
  const x = (index: number) => left + (index * (width - left - right)) / Math.max(points.length - 1, 1);
  const y = (value: number) => top + ((110 - value) * (height - top - bottom)) / 40;
  const line = (key: "protein" | "carbs" | "fat") => points.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");
  return <div className="chart-wrap" role="img" aria-label="Macro adherence chart for protein carbs and fat">
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[70, 90, 110].map((tick) => <g key={tick}><line className="chart-grid-line" x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} /><text className="chart-axis" x="2" y={y(tick) + 3}>{tick}%</text></g>)}
      <polyline points={line("protein")} fill="none" stroke="#2f9e44" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      <polyline points={line("carbs")} fill="none" stroke="#f0a43c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      <polyline points={line("fat")} fill="none" stroke="#7c72d8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      {points.map((point, index) => <text className="chart-axis" key={point.label} textAnchor="middle" x={x(index)} y={height - 11}>{point.label}</text>)}
    </svg>
  </div>;
}
