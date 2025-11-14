import React from "react";
import { Skeleton } from "./Skeleton";
import styles from "./DashboardSkeleton.module.css";

export const DashboardSkeleton = () => {
  return (
    <div className={styles.pageContainer}>
      {/* Welcome Header Skeleton */}
      <div className={styles.welcomeHeader}>
        <Skeleton style={{ width: "250px", height: "2.25rem" }} />
        <Skeleton style={{ width: "400px", height: "1.25rem", marginTop: "var(--spacing-2)" }} />
      </div>

      <div className={styles.gridContainer}>
        {/* Today's Metrics Skeleton */}
        <div className={`${styles.gridItem} ${styles.metrics}`}>
          <Skeleton style={{ width: "150px", height: "1.5rem", marginBottom: "var(--spacing-6)" }} />
          <div className={styles.metricCards}>
            <div className={styles.metricCard}>
              <Skeleton style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)" }} />
              <div className={styles.metricInfo}>
                <Skeleton style={{ width: "80px", height: "1.25rem" }} />
                <Skeleton style={{ width: "50px", height: "1rem" }} />
              </div>
            </div>
            <div className={styles.metricCard}>
              <Skeleton style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)" }} />
              <div className={styles.metricInfo}>
                <Skeleton style={{ width: "80px", height: "1.25rem" }} />
                <Skeleton style={{ width: "50px", height: "1rem" }} />
              </div>
            </div>
            <div className={styles.metricCard}>
              <Skeleton style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)" }} />
              <div className={styles.metricInfo}>
                <Skeleton style={{ width: "80px", height: "1.25rem" }} />
                <Skeleton style={{ width: "50px", height: "1rem" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Skeleton */}
        <div className={`${styles.gridItem} ${styles.achievements}`}>
          <Skeleton style={{ width: "180px", height: "1.5rem", marginBottom: "var(--spacing-6)" }} />
          <div className={styles.achievementList}>
            <Skeleton style={{ height: "1.25rem" }} />
            <Skeleton style={{ height: "1.25rem" }} />
            <Skeleton style={{ height: "1.25rem" }} />
          </div>
        </div>

        {/* Progress Skeleton */}
        <div className={`${styles.gridItem} ${styles.progress}`}>
          <Skeleton style={{ width: "200px", height: "1.5rem", marginBottom: "var(--spacing-6)" }} />
          <Skeleton style={{ height: "250px" }} />
        </div>

        {/* Nutrition Skeleton */}
        <div className={`${styles.gridItem} ${styles.nutrition}`}>
          <Skeleton style={{ width: "180px", height: "1.5rem", marginBottom: "var(--spacing-6)" }} />
          <Skeleton style={{ height: "1rem", width: "80%" }} />
          <Skeleton style={{ height: "1rem", width: "60%", marginTop: "var(--spacing-2)" }} />
          <Skeleton style={{ height: "150px", marginTop: "var(--spacing-6)" }} />
        </div>

        {/* Interactions Skeleton */}
        <div className={`${styles.gridItem} ${styles.interactions}`}>
          <Skeleton style={{ width: "220px", height: "1.5rem", marginBottom: "var(--spacing-6)" }} />
          <div className={styles.interactionList}>
            <Skeleton style={{ height: "40px", width: "70%", alignSelf: "flex-start" }} />
            <Skeleton style={{ height: "30px", width: "50%", alignSelf: "flex-end" }} />
            <Skeleton style={{ height: "50px", width: "80%", alignSelf: "flex-start" }} />
          </div>
        </div>
      </div>
    </div>
  );
};