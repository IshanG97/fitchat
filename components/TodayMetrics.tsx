import React from "react";
import { Footprints, Flame, Timer } from "lucide-react";
import type { OutputType as DashboardOutput } from "../endpoints/dashboard_GET.schema";
import { AppleHealthBadge } from "./AppleHealthBadge";
import styles from "./TodayMetrics.module.css";

interface Props {
  metrics: DashboardOutput["todayMetrics"];
}

const metricConfig = [
  {
    key: "steps",
    label: "Steps",
    icon: Footprints,
    color: "var(--chart-color-2)",
  },
  {
    key: "activeMinutes",
    label: "Active Mins",
    icon: Timer,
    color: "var(--chart-color-3)",
  },
  {
    key: "caloriesBurned",
    label: "Calories",
    icon: Flame,
    color: "var(--chart-color-5)",
  },
];

export const TodayMetrics = ({ metrics }: Props) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Today's Metrics</h2>
          <p className={styles.subtitle}>Real-time data from Apple Health</p>
        </div>
        <AppleHealthBadge 
          isConnected={true} 
          lastSync={new Date()} 
          className={styles.badge}
        />
      </div>
      <div className={styles.metricsGrid}>
        {metricConfig.map((item) => (
          <div key={item.key} className={styles.metricCard}>
            <div
              className={styles.iconWrapper}
              style={{ backgroundColor: item.color }}
            >
              <item.icon size={24} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.value}>
                {metrics[item.key as keyof typeof metrics].toLocaleString()}
                {item.key === 'caloriesBurned' && <span className={styles.unit}> cal</span>}
                {item.key === 'activeMinutes' && <span className={styles.unit}> min</span>}
              </span>
              <span className={styles.label}>{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};