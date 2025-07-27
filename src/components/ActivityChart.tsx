"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { godzina: "8:00", odpowiedzi: 2 },
  { godzina: "9:00", odpowiedzi: 5 },
  { godzina: "10:00", odpowiedzi: 8 },
  { godzina: "11:00", odpowiedzi: 12 },
  { godzina: "12:00", odpowiedzi: 18 },
  { godzina: "13:00", odpowiedzi: 15 },
  { godzina: "14:00", odpowiedzi: 10 },
  { godzina: "15:00", odpowiedzi: 7 },
  { godzina: "16:00", odpowiedzi: 4 },
];

export default function ActivityChart() {
  return (
    <ResponsiveContainer width="100%" height={320} className="!m-0 !p-0">
      <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
        <XAxis dataKey="godzina" stroke="#6b7280" fontSize={14} />
        <YAxis stroke="#6b7280" fontSize={14} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #a78bfa", color: "#312e81", fontWeight: 600 }} labelStyle={{ color: '#6366f1' }} itemStyle={{ color: '#312e81' }} />
        <Line type="monotone" dataKey="odpowiedzi" stroke="#7c3aed" strokeWidth={4} dot={{ r: 7, fill: "#a78bfa", stroke: "#7c3aed", strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
} 