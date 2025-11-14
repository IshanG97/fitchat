import React from "react";
import styles from "./HowItWorksSection.module.css";
import { UserPlus, MessageSquare, Award } from "lucide-react";

const steps = [
  {
    icon: <UserPlus size={32} />,
    title: "Sign Up",
    description: "Quickly sign up and connect your WhatsApp. No lengthy forms, no hassle.",
  },
  {
    icon: <MessageSquare size={32} />,
    title: "Chat on WhatsApp",
    description: "Start chatting with your AI coach immediately. It's always on, ready to guide and motivate you.",
  },
  {
    icon: <Award size={32} />,
    title: "Get Fit",
    description: "Follow your personalized plan, track your progress, and smash your fitness goals.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.titleContainer}>
        <h2 className={styles.title}>How It Works</h2>
        <p className={styles.subtitle}>Get started in just three simple steps.</p>
      </div>
      <div className={styles.stepsGrid}>
        {steps.map((step, index) => (
          <div key={index} className={styles.stepCard}>
            <div className={styles.iconWrapper}>{step.icon}</div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDescription}>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};