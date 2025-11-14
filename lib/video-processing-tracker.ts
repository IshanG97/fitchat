// Simple in-memory tracker for recent video processing
// In production, you might want to use Redis or database for persistence

interface VideoProcessingState {
  timestamp: number;
  isProcessing: boolean;
}

class VideoProcessingTracker {
  private static userVideoStates = new Map<string, VideoProcessingState>();
  private static PROCESSING_WINDOW = 60000; // 1 minute window

  static markVideoProcessingStart(userId: string): void {
    this.userVideoStates.set(userId, {
      timestamp: Date.now(),
      isProcessing: true
    });
  }

  static markVideoProcessingComplete(userId: string): void {
    const state = this.userVideoStates.get(userId);
    if (state) {
      state.isProcessing = false;
    }
  }

  static isRecentlyProcessingVideo(userId: string): boolean {
    const state = this.userVideoStates.get(userId);
    if (!state) return false;

    const now = Date.now();
    const timeSinceVideo = now - state.timestamp;
    
    // Clean up old entries
    if (timeSinceVideo > this.PROCESSING_WINDOW) {
      this.userVideoStates.delete(userId);
      return false;
    }

    return state.isProcessing || timeSinceVideo < 30000; // 30 seconds after completion
  }

  static getTimeSinceLastVideo(userId: string): number | null {
    const state = this.userVideoStates.get(userId);
    if (!state) return null;
    
    return Date.now() - state.timestamp;
  }
}

export default VideoProcessingTracker;