"use client";

import { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

export interface ActivityDay {
  date: string;
  count: number;
}

type HeatmapValue = { date: string; count?: number } | undefined;

function classForValue(value: HeatmapValue): string {
  const count = value?.count ?? 0;
  if (count === 0) return "heatmap-empty";
  if (count <= 3) return "heatmap-1";
  if (count <= 7) return "heatmap-2";
  return "heatmap-3";
}

function titleForValue(value: HeatmapValue): string {
  if (!value) return "";
  const d = new Date(value.date + "T12:00:00");
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const count = value.count ?? 0;
  const problems = count === 1 ? "problem" : "problems";
  return `${label}: ${count} ${problems} solved`;
}

export function ActivityHeatmap() {
  const [data, setData] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity-heatmap")
      .then(async (r) => {
        if (!r.ok) return;
        const json = await r.json();
        setData(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 365);

  if (loading) {
    return (
      <div className="rounded-lg border-2 border-foreground/10 bg-foreground/[0.02] p-6 flex items-center justify-center min-h-[140px]">
        <div className="h-4 w-24 bg-foreground/10 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .react-calendar-heatmap .heatmap-empty { fill: hsl(var(--foreground) / 0.1); }
        .react-calendar-heatmap .heatmap-1 { fill: rgb(52 211 153 / 0.4); }
        .react-calendar-heatmap .heatmap-2 { fill: rgb(16 185 129 / 0.7); }
        .react-calendar-heatmap .heatmap-3 { fill: rgb(16 185 129); }
        .react-calendar-heatmap rect:hover { stroke: hsl(var(--foreground) / 0.4); stroke-width: 1px; }
        .react-calendar-heatmap text { font-size: 9px; fill: hsl(var(--foreground) / 0.5); }
      `}</style>
      <div className="rounded-lg border-2 border-foreground/10 bg-foreground/[0.02] p-4 overflow-x-auto">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={data}
          classForValue={classForValue as (v: unknown) => string}
          titleForValue={titleForValue as (v: unknown) => string}
          showMonthLabels
          showWeekdayLabels
          gutterSize={2}
        />
      </div>
    </>
  );
}
