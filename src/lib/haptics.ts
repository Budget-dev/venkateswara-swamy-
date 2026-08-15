export const triggerVibration = (pattern: number | number[] = 50) => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors
    }
  }
};
export const hapticPatterns = {
  light: 10,
  medium: 30,
  heavy: 50,
  success: [30, 50, 30],
  error: [50, 100, 50],
};
