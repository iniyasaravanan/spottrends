interface Props {
  value: number;
  color?: string;
  label?: string;
}

export default function PopularityBar({
  value,
  color = "#1DB954",
  label,
}: Props) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-spotify-light">
          <span>{label}</span>
          <span>{value}</span>
        </div>
      )}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
