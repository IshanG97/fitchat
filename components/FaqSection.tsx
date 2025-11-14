import React from "react";
import styles from "./FaqSection.module.css";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./Accordion";

const faqs = [
  {
    question: "Is my data and privacy secure?",
    answer: "Absolutely. We use end-to-end encryption for all communications. Your personal data, conversations, and fitness progress are kept confidential and are never shared with third parties.",
  },
  {
    question: "How do I set up FitChat?",
    answer: "It's simple! Just click any 'Start Free' button on our site. This will open a chat with the FitChat AI on WhatsApp. Send the first message, and your coach will guide you through the quick setup process.",
  },
  {
    question: "What kind of training style does the AI use?",
    answer: "Our AI is inspired by the world's toughest coaches. It's direct, motivational, and focused on discipline and results. It will push you to be your best, but the plans are always personalized to your fitness level and goals.",
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Yes, you can cancel your premium subscription at any time directly from your account settings. You will retain premium access until the end of your current billing period.",
  },
];

export const FaqSection = () => {
  return (
    <section id="faq" className={styles.section}>
      <div className={styles.titleContainer}>
        <h2 className={styles.title}>Frequently Asked Questions</h2>
        <p className={styles.subtitle}>Have questions? We've got answers.</p>
      </div>
      <div className={styles.accordionContainer}>
        <Accordion type="single" collapsible>
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};