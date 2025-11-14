import React from "react";
import styles from "./FeaturesSection.module.css";
import { Bot, BarChart3, Video, Zap, HeartPulse } from "lucide-react";

const features = [
  {
    icon: <Bot size={24} />,
    title: "Real-Time Coaching",
    description: "Get instant feedback and guidance during your workouts, just like a real personal trainer.",
  },
  {
    icon: <BarChart3 size={24} />,
    title: "Progress Tracking",
    description: "Your coach logs every workout, tracks your stats, and shows your progress over time.",
  },
  {
    icon: <Video size={24} />,
    title: "Form Feedback",
    description: "Submit videos of your exercises and get AI-powered analysis to perfect your form and prevent injury.",
  },
  {
    icon: <HeartPulse size={24} />,
    title: "Wearable Integration",
    description: "Sync data from your favorite fitness trackers to give your coach the full picture of your activity.",
  },
  {
    icon: <Zap size={24} />,
    title: "Motivational Nudges",
    description: "Receive Goggins-style motivation to stay disciplined and push past your limits.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.titleContainer}>
        <h2 className={styles.title}>Everything You Need to Succeed</h2>
        <p className={styles.subtitle}>FitChat is packed with features to keep you on track and motivated.</p>
      </div>
      <div className={styles.featuresGrid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.featureCard}>
            <div className={styles.iconWrapper}>{feature.icon}</div>
            <div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};