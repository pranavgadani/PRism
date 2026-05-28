const ScoreBadge = ({ score, size = 100 }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score || 0, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  const getColor = (s) => {
    if (s >= 75) return '#10b981';  // green
    if (s >= 50) return '#f59e0b';  // yellow
    return '#ef4444';               // red
  };

  const getLabel = (s) => {
    if (s >= 75) return 'Excellent';
    if (s >= 50) return 'Fair';
    return 'Needs Work';
  };

  const color = getColor(progress);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {progress}
        </text>
        <text
          x={size / 2}
          y={size / 2 + size * 0.18}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-muted)"
          fontSize={size * 0.1}
          fontFamily="Inter, sans-serif"
        >
          /100
        </text>
      </svg>
      <span style={{ fontSize: '0.75rem', color, fontWeight: 600 }}>{getLabel(progress)}</span>
    </div>
  );
};

export default ScoreBadge;
