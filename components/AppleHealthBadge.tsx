import React from "react";
import { Badge } from "./Badge";
import { Heart, Smartphone, Wifi, WifiOff } from "lucide-react";
import styles from "./AppleHealthBadge.module.css";

interface Props {
  isConnected?: boolean;
  showHeartRate?: boolean;
  lastSync?: Date;
  className?: string;
}

export const AppleHealthBadge = ({ 
  isConnected = true, 
  showHeartRate = false, 
  lastSync,
  className 
}: Props) => {
  const syncStatus = lastSync ? new Date().getTime() - lastSync.getTime() < 300000 : true; // 5 minutes
  
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Badge 
        variant={isConnected ? "success" : "destructive"}
        className={styles.badge}
      >
        <Smartphone size={12} />
        Apple Health
        {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
      </Badge>
      
      {showHeartRate && isConnected && (
        <Badge variant="default" className={styles.heartRateBadge}>
          <Heart size={12} className={styles.heartIcon} />
          Heart Rate Tracking
        </Badge>
      )}
      
      {lastSync && (
        <span className={styles.syncTime}>
          Last sync: {syncStatus ? 'Just now' : `${Math.floor((new Date().getTime() - lastSync.getTime()) / 60000)}m ago`}
        </span>
      )}
    </div>
  );
};