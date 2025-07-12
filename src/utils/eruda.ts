// Eruda mobile debugging utility
// Only loads on mobile devices and when conditions are met

const isMobileDevice = (): boolean => {
  // eslint-disable-next-line no-undef
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  // eslint-disable-next-line no-undef
  const userAgent = navigator.userAgent.toLowerCase();
  // eslint-disable-next-line no-undef
  const screenWidth = window.innerWidth;
  
  return (
    screenWidth <= 768 ||
    /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  );
};

const shouldLoadEruda = (): boolean => {
  // Load Eruda if:
  // 1. It's a mobile device AND
  // 2. (Development mode OR URL contains debug parameter)
  
  if (!isMobileDevice()) {
    return false;
  }
  
  // eslint-disable-next-line no-undef
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check for debug parameter in URL
  // eslint-disable-next-line no-undef
  const urlParams = new URLSearchParams(window.location.search);
  const hasDebugParam = urlParams.has('debug') || urlParams.has('eruda');
  
  return isDevelopment || hasDebugParam;
};

export const initializeEruda = async (): Promise<void> => {
  if (!shouldLoadEruda()) {
    return;
  }
  
  try {
    // Import Eruda dynamically to avoid loading it unnecessarily
    const eruda = await import('eruda');
    
    // Initialize Eruda
    eruda.default.init({
      // Hide Eruda by default, user can show it by tapping the icon
      autoShow: false,
      // Position the entry button
      entryBtn: true,
      // Custom styles for the entry button
      tool: ['console', 'elements', 'network', 'resources', 'info', 'snippets', 'sources'],
    });
    
    // Add some styling to make the entry button more visible
    const style = document.createElement('style');
    style.textContent = `
      .eruda-entry-btn {
        background: linear-gradient(135deg, #00966F 0%, #00B886 100%) !important;
        border: 2px solid #fff !important;
        box-shadow: 0 4px 12px rgba(0, 150, 111, 0.3) !important;
        z-index: 999999 !important;
      }
      .eruda-entry-btn:active {
        transform: scale(0.95) !important;
      }
    `;
    document.head.appendChild(style);
    
    // eslint-disable-next-line no-console, no-undef
    console.log('📱 Eruda mobile debugging console initialized');
    // eslint-disable-next-line no-console, no-undef
    console.log('🔧 Tap the floating button to open the console');
    
  } catch (error) {
    // eslint-disable-next-line no-console, no-undef
    console.warn('Failed to initialize Eruda:', error);
  }
};