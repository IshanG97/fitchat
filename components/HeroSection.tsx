import React from "react";
import { Button } from "./Button";
import styles from "./HeroSection.module.css";
import { ChatMockup } from "./ChatMockup";
import { ArrowRight } from "lucide-react";

export const HeroSection = () => {
  const WHATSAPP_LINK = "https://wa.me/1234567890?text=I'm%20ready%20to%20start%20my%20fitness%20journey!";

  return (
    <section className={styles.hero}>
      <div className={styles.contentWrapper}>
        <div className={styles.textContainer}>
          <h1 className={styles.headline}>
            Your Personal Coach,
            <br />
            Right in <span className={styles.highlight}>WhatsApp</span>
          </h1>
          <p className={styles.tagline}>
            Real-time workouts, personalized plans, and constant motivation – no app install needed.
          </p>
          <div className={styles.ctaContainer}>
            <Button asChild size="lg" className={styles.ctaButton}>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                Start Free on WhatsApp
                <ArrowRight size={20} />
              </a>
            </Button>
            <a href="#how-it-works" className={styles.secondaryLink}>
              Learn More
            </a>
          </div>
        </div>
        <div className={styles.mockupContainer}>
          <ChatMockup />
        </div>
      </div>
    </section>
  );
};