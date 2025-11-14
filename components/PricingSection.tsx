import React from "react";
import styles from "./PricingSection.module.css";
import { Button } from "./Button";
import { Check } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/1234567890?text=I'm%20ready%20to%20start%20my%20fitness%20journey!";

export const PricingSection = () => {
  return (
    <section id="pricing" className={styles.section}>
      <div className={styles.titleContainer}>
        <h2 className={styles.title}>Simple, Transparent Pricing</h2>
        <p className={styles.subtitle}>Choose the plan that's right for you. No hidden fees, ever.</p>
      </div>
      <div className={styles.pricingGrid}>
        <div className={styles.pricingCard}>
          <h3 className={styles.planName}>Free Trial</h3>
          <p className={styles.price}>
            $0 <span className={styles.pricePeriod}>/ 7 days</span>
          </p>
          <p className={styles.planDescription}>Get a taste of what FitChat can do. No credit card required.</p>
          <ul className={styles.featureList}>
            <li><Check size={16} /> Personalized Workout Plan</li>
            <li><Check size={16} /> Real-Time AI Coaching</li>
            <li><Check size={16} /> Basic Progress Tracking</li>
          </ul>
          <Button asChild variant="outline" size="lg" className={styles.ctaButton}>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">Start Free Trial</a>
          </Button>
        </div>

        <div className={`${styles.pricingCard} ${styles.premiumCard}`}>
          <h3 className={styles.planName}>Premium</h3>
          <p className={styles.price}>
            $19 <span className={styles.pricePeriod}>/ month</span>
          </p>
          <p className={styles.planDescription}>Unlock your full potential with unlimited access to all features.</p>
          <ul className={styles.featureList}>
            <li><Check size={16} /> Everything in Free Trial, plus:</li>
            <li><Check size={16} /> Unlimited Form Feedback</li>
            <li><Check size={16} /> Wearable Device Integration</li>
            <li><Check size={16} /> Advanced Progress Analytics</li>
            <li><Check size={16} /> Priority Support</li>
          </ul>
          <Button asChild size="lg" className={styles.ctaButton}>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">Go Premium</a>
          </Button>
        </div>
      </div>
    </section>
  );
};