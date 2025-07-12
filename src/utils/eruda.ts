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
  // Load Eruda on mobile devices by default
  return isMobileDevice();
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
      // Position the entry button
      // eslint-disable-next-line no-undef
      container: document.body,
      tool: [
        'console',
        'elements',
        'network',
        'resources',
        'info',
        'snippets',
        'sources',
      ],
    });

    // Add some styling to make the entry button more visible
    // eslint-disable-next-line no-undef
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
    // eslint-disable-next-line no-undef
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
