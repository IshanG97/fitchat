import React from "react";
import styles from "./CtaSection.module.css";
import { Button } from "./Button";
import { ArrowRight } from "lucide-react";

export const CtaSection = () => {
  const WHATSAPP_LINK = "https://wa.me/1234567890?text=I'm%20ready%20to%20start%20my%20fitness%20journey!";

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.title}>Stop Thinking, Start Doing.</h2>
        <p className={styles.subtitle}>
          Your journey to peak fitness starts with a single message. Are you ready to get to work?
        </p>
        <Button asChild size="lg" className={styles.ctaButton}>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            Start Free on WhatsApp
            <ArrowRight size={20} />
          </a>
        </Button>
      </div>
    </section>
  );
};