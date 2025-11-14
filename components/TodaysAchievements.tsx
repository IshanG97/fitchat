import React from "react";
import { CheckCircle2, Dumbbell, Apple } from "lucide-react";
import type { OutputType as DashboardOutput } from "../endpoints/dashboard_GET.schema";
import styles from "./TodaysAchievements.module.css";

interface Props {
  workoutSummary: DashboardOutput["todaysWorkoutSummary"];
}

export const TodaysAchievements = ({ workoutSummary }: Props) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Today's Achievements</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <div className={`${styles.iconWrapper} ${styles.apple}`}>
            <Apple size={18} />
          </div>
          <span className={styles.text}>Synced with Apple Health</span>
        </li>
        {workoutSummary.map((exercise, index) => (
          <li key={index} className={styles.listItem}>
            <div className={`${styles.iconWrapper} ${styles.workout}`}>
              <Dumbbell size={18} />
            </div>
            <span className={styles.text}>
              Completed {exercise.exerciseType}
            </span>
          </li>
        ))}
        <li className={styles.listItem}>
          <div className={`${styles.iconWrapper} ${styles.form}`}>
            <CheckCircle2 size={18} />
          </div>
          <span className={styles.text}>Improved pull-up form</span>
        </li>
      </ul>
    </div>
  );
};