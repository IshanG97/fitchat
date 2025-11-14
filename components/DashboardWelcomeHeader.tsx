import React from "react";
import type { OutputType as DashboardOutput } from "../endpoints/dashboard_GET.schema";
import styles from "./DashboardWelcomeHeader.module.css";

interface Props {
  userProfile: DashboardOutput["userProfile"];
}

export const DashboardWelcomeHeader = ({ userProfile }: Props) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome back, Ishan!</h1>
      <p className={styles.subtitle}>
        Time to get after it. Your goal is to{" "}
        <span className={styles.goal}>{userProfile.fitnessGoal}</span>. No
        excuses.
      </p>
    </div>
  );
};