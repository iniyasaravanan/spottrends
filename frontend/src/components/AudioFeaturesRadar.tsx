"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { AudioFeatures } from "@/lib/api";

interface ArtistFeatures {
  name: string;
  features: AudioFeatures;
  color: string;
}

interface Props {
  artists: ArtistFeatures[];
}

const AXES = [
  { key: "energy", label: "Energy" },
  { key: "danceability", label: "Dance" },
  { key: "valence", label: "Valence" },
  { key: "acousticness", label: "Acoustic" },
  { key: "liveness", label: "Live" },
  { key: "speechiness", label: "Speech" },
  { key: "instrumentalness", label: "Instr." },
];

function normalise(key: string, val: number): number {
  // tempo is 0–250 BPM; scale to 0–1
  if (key === "tempo") return Math.min(val / 200, 1);
  return val;
}

export default function AudioFeaturesRadar({ artists }: Props) {
  const data = AXES.map(({ key, label }) => {
    const point: Record<string, string | number> = { subject: label };
    for (const a of artists) {
      point[a.name] = parseFloat(
        (normalise(key, (a.features as unknown as Record<string, number>)[key]) * 100).toFixed(1)
      );
    }
    return point;
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#B3B3B3", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1E1E1E",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(val: number) => [`${val}%`, ""]}
          />
          {artists.map((a) => (
            <Radar
              key={a.name}
              name={a.name}
              dataKey={a.name}
              stroke={a.color}
              fill={a.color}
              fillOpacity={0.15}
              dot={false}
            />
          ))}
          {artists.length > 1 && (
            <Legend wrapperStyle={{ color: "#B3B3B3", fontSize: 12 }} />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
