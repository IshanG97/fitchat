import React from "react";
import styles from "./ChatMockup.module.css";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";

export const ChatMockup = () => {
  return (
    <div className={styles.mockupWrapper}>
      <div className={styles.chatContainer}>
        <div className={styles.header}>
          <Avatar className={styles.avatar}>
            <AvatarImage src="https://images.unsplash.com/photo-1594882645126-14020914d58d" alt="FitChat AI Coach" />
            <AvatarFallback>FC</AvatarFallback>
          </Avatar>
          <div className={styles.headerInfo}>
            <p className={styles.name}>FitChat</p>
            <p className={styles.status}>online</p>
          </div>
        </div>
        <div className={styles.messageArea}>
          <div className={`${styles.message} ${styles.coach}`}>
            <p>Alright, let's get after it! Today is leg day. No excuses. Your first exercise: 3 sets of 12 goblet squats. Stay hard!</p>
          </div>
          <div className={`${styles.message} ${styles.user}`}>
            <p>Got it. Let's do this!</p>
          </div>
          <div className={`${styles.message} ${styles.coach}`}>
            <p>Good. Now send a video of your form for the last set. I'll check it. Don't you dare cheat yourself.</p>
          </div>
        </div>
        <div className={styles.inputArea}>
          <p>Type a message...</p>
        </div>
      </div>
    </div>
  );
};