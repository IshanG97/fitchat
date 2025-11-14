import React from "react";
import styles from "./TestimonialsSection.module.css";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";

const testimonials = [
  {
    name: "Sarah J.",
    role: "Marathon Runner",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    quote: "FitChat is relentless. It's like having David Goggins in my pocket, pushing me every single day. I've never been more consistent.",
  },
  {
    name: "Mike R.",
    role: "Busy Professional",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    quote: "I thought I had no time to work out. FitChat proved me wrong. The short, intense workouts fit my schedule and the results are undeniable.",
  },
  {
    name: "Elena G.",
    role: "Fitness Enthusiast",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    quote: "The form feedback is a game-changer. I corrected my squat and deadlift, and I'm lifting heavier and safer than ever before.",
  },
];

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className={styles.section}>
      <div className={styles.titleContainer}>
        <h2 className={styles.title}>Don't Just Take Our Word For It</h2>
        <p className={styles.subtitle}>See what our users are saying about their transformation with FitChat.</p>
      </div>
      <div className={styles.testimonialsGrid}>
        {testimonials.map((testimonial, index) => (
          <div key={index} className={styles.testimonialCard}>
            <p className={styles.quote}>"{testimonial.quote}"</p>
            <div className={styles.authorInfo}>
              <Avatar>
                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className={styles.authorName}>{testimonial.name}</p>
                <p className={styles.authorRole}>{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};