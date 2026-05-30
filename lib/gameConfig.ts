export const TIMER_DURATION_SECONDS = 12;
export const TOTAL_DAILY_CHALLENGES = 5;

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  
  // Detect Capacitor custom protocols or native WebView localhosts
  const isNative = window.location.protocol === 'capacitor:' || 
                   window.location.protocol === 'http:' && window.location.hostname === 'localhost' ||
                   window.location.origin.includes('file://');
                   
  const productionHost = 'https://www.uncanny.info';
  return isNative ? `${productionHost}${path}` : path;
}
