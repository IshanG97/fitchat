import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import type { RecentInteraction } from "../endpoints/coach/recent_GET.schema";
import styles from "./RecentInteractions.module.css";
import { Bot, User } from "lucide-react";

interface Props {
  interactions: RecentInteraction[];
}

export const RecentInteractions = ({ interactions }: Props) => {
  // Reverse to show oldest first for conversational flow
  const sortedInteractions = [...interactions].reverse();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Recent Coach Interactions</h2>
      <div className={styles.chatArea}>
        {sortedInteractions.map((interaction) => (
          <React.Fragment key={interaction.id}>
            {interaction.userMessage && (
              <div className={`${styles.message} ${styles.user}`}>
                <Avatar className={styles.avatar}>
                  <AvatarFallback>
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
                <div className={styles.bubble}>
                  <p>{interaction.userMessage}</p>
                </div>
              </div>
            )}
            {interaction.coachResponse && (
              <div className={`${styles.message} ${styles.coach}`}>
                <Avatar className={styles.avatar}>
                  <AvatarFallback>
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
                <div className={styles.bubble}>
                  <p>{interaction.coachResponse}</p>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};