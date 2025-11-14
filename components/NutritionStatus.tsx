import React from "react";
import { Progress } from "./Progress";
import { Flame, Utensils, Apple } from "lucide-react";
import { AppleHealthBadge } from "./AppleHealthBadge";
import type { OutputType as DashboardOutput } from "../endpoints/dashboard_GET.schema";
import type { OutputType as NutritionOutput } from "../endpoints/nutrition/latest_GET.schema";
import styles from "./NutritionStatus.module.css";

interface Props {
  proteinIntake: DashboardOutput["proteinIntake"];
  latestMeal: NutritionOutput | null;
}

export const NutritionStatus = ({ proteinIntake, latestMeal }: Props) => {
  const { currentGrams, targetGrams } = proteinIntake;
  const progressPercentage =
    targetGrams && currentGrams ? (currentGrams / targetGrams) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Diet Plan Progress</h2>
        <AppleHealthBadge 
          isConnected={true}
          className={styles.badge}
        />
      </div>
      <div className={styles.proteinTracker}>
        <div className={styles.proteinHeader}>
          <span className={styles.proteinLabel}>Protein Target</span>
          <span className={styles.proteinValues}>
            {currentGrams}g / {targetGrams ?? 140}g
          </span>
        </div>
        <Progress value={progressPercentage} />
        <div className={styles.mealBreakdown}>
          <div className={styles.mealItem}>
            <Apple size={14} />
            <span>Breakfast: 25g</span>
          </div>
          <div className={styles.mealItem}>
            <Apple size={14} />
            <span>Lunch: 35g</span>
          </div>
          <div className={styles.mealItem}>
            <Apple size={14} />
            <span>Dinner: 40g</span>
          </div>
        </div>
      </div>

      {latestMeal && (
        <div className={styles.mealCard}>
          <h3 className={styles.mealTitle}>Latest Meal Analysis</h3>
          {latestMeal.imageUrl && (
            <img
              src={latestMeal.imageUrl}
              alt={latestMeal.mealDescription ?? "Latest meal"}
              className={styles.mealImage}
            />
          )}
          <div className={styles.mealInfo}>
            <div className={styles.mealStat}>
              <Utensils size={16} className={styles.mealIcon} />
              <span>{latestMeal.mealDescription}</span>
            </div>
            <div className={styles.mealStat}>
              <Flame size={16} className={styles.mealIcon} />
              <span>{latestMeal.calories} calories</span>
            </div>
          </div>
          <div className={styles.aiFeedback}>
            <p className={styles.feedbackLabel}>Coach Feedback:</p>
            <p className={styles.feedbackText}>{latestMeal.aiFeedback}</p>
          </div>
        </div>
      )}
    </div>
  );
};