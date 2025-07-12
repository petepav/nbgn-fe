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

  // Also check if the browser is in responsive design mode
  // eslint-disable-next-line no-undef
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    screenWidth <= 768 ||
    hasTouch ||
    /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  );
};

export const initializeEruda = async (): Promise<void> => {
  // Only initialize on mobile to capture logs from the start
  if (!isMobileDevice()) {
    return;
  }

  try {
    // Import Eruda dynamically
    const eruda = await import('eruda');

    // Initialize Eruda normally but completely hidden
    eruda.default.init({
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
      autoScale: false,
      useShadowDom: false, // Disable shadow DOM to avoid isolation
    });
    
    // Keep Eruda hidden but active
    eruda.default.hide();
    
    // Immediately add styles to keep it completely off-screen
    // eslint-disable-next-line no-undef
    const style = document.createElement('style');
    style.setAttribute('data-eruda-hidden', 'true');
    style.textContent = `
      .eruda-entry-btn {
        display: none !important;
      }
      #eruda {
        position: fixed !important;
        top: -9999px !important;
        left: -9999px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        opacity: 0 !important;
      }
    `;
    // eslint-disable-next-line no-undef
    document.head.appendChild(style);
    
    // Store Eruda instance globally so debug page can access it
    // eslint-disable-next-line no-undef
    (window as any).__eruda = eruda.default;

    // eslint-disable-next-line no-console, no-undef
    console.log('📱 Eruda initialized (hidden) - capturing logs from startup');
  } catch (error) {
    // eslint-disable-next-line no-console, no-undef
    console.warn('Failed to initialize Eruda:', error);
  }
};