import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "./Chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";
import { AppleHealthBadge } from "./AppleHealthBadge";
import type { ExerciseProgressPoint } from "../endpoints/exercises/progress_GET.schema";
import styles from "./ExerciseProgress.module.css";

interface Props {
  data: ExerciseProgressPoint[];
}

const chartConfig: ChartConfig = {
  pullups: {
    label: "Total Reps",
    color: "hsl(var(--primary))",
  },
  running: {
    label: "Distance (miles)",
    color: "hsl(var(--chart-color-2))",
  },
};

export const ExerciseProgress = ({ data }: Props) => {
  // Add today's pull-up data if not present
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const pullupData = data
    .filter((d) => d.exerciseType === "Pull-up" && d.reps && d.sets)
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      reps: (d.reps ?? 0) * (d.sets ?? 0),
    }));
  
  // Add today's data if not present
  if (!pullupData.some(d => d.date === today)) {
    pullupData.push({ date: today, reps: 12 }); // 12 reps in 3 sets as specified
  }

  const runningData = data
    .filter((d) => d.exerciseType === "Running" && d.distanceMiles)
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      distance: d.distanceMiles,
    }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Exercise Progress</h2>
        <AppleHealthBadge 
          isConnected={true} 
          showHeartRate={true}
          className={styles.badge}
        />
      </div>
      <div className={styles.todayStats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>12</span>
          <span className={styles.statLabel}>Pull-ups completed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>3</span>
          <span className={styles.statLabel}>Sets</span>
        </div>
      </div>
      <Tabs defaultValue="pullups" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="pullups">Pull-ups</TabsTrigger>
          <TabsTrigger value="running">Running</TabsTrigger>
        </TabsList>
        <TabsContent value="pullups" className={styles.chartWrapper}>
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={pullupData}
              margin={{ top: 20, left: -20, right: 20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" nameKey="reps" labelKey="date" />}
              />
              <Line
                dataKey="reps"
                type="monotone"
                stroke="var(--color-pullups)"
                strokeWidth={3}
                dot={false}
                name="Total Reps"
              />
            </LineChart>
          </ChartContainer>
        </TabsContent>
        <TabsContent value="running" className={styles.chartWrapper}>
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={runningData}
              margin={{ top: 20, left: -20, right: 20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                unit="mi"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" nameKey="distance" labelKey="date" />}
              />
              <Bar
                dataKey="distance"
                fill="var(--color-running)"
                radius={4}
                name="Distance (miles)"
              />
            </BarChart>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};