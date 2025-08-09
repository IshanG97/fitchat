// lib/startup.ts
// This file ensures all background services are initialized properly

// Import services to trigger their initialization
import './scheduler';  // This will initialize the task scheduler
import './realtime';   // This will initialize the realtime service

console.log('🚀 FitChat services initialized');

export {};