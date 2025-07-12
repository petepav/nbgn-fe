import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DebugConsole.css';

export const DebugConsole: React.FC = () => {
  useEffect(() => {
    const showEruda = () => {
      // Check if Eruda is already initialized
      // eslint-disable-next-line no-undef
      const existingEruda = (window as any).__eruda;
      
      if (existingEruda) {
        // Eruda is already initialized, just show it
        existingEruda.show();
      } else {
        // Initialize Eruda if not already done (for desktop)
        const loadEruda = async () => {
          try {
            const eruda = await import('eruda');

            // Initialize Eruda
            eruda.default.init({
              // eslint-disable-next-line no-undef
              container:
                document.getElementById('eruda-container') || document.body,
              tool: [
                'console',
                'elements',
                'network',
                'resources',
                'info',
                'snippets',
                'sources',
              ],
              autoScale: true,
              useShadowDom: true,
            });

            // Show Eruda console
            eruda.default.show();
            
            // Store instance
            // eslint-disable-next-line no-undef
            (window as any).__eruda = eruda.default;
          } catch (error) {
            // eslint-disable-next-line no-console, no-undef
            console.error('Failed to load Eruda:', error);
          }
        };
        
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        void loadEruda();
        return;
      }

      // Override hidden styles to show Eruda properly on debug page
      // eslint-disable-next-line no-undef
      const existingStyle = document.querySelector('style[data-eruda-hidden]');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Add custom styling for debug page
      // eslint-disable-next-line no-undef
      const style = document.createElement('style');
      style.setAttribute('data-eruda-debug', 'true');
      style.textContent = `
        #eruda {
          position: fixed !important;
          top: 60px !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          height: calc(100vh - 60px) !important;
          z-index: 9999 !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        .eruda-entry-btn {
          display: none !important;
        }
      `;
      // eslint-disable-next-line no-undef
      document.head.appendChild(style);
      
      // Move Eruda back to visible container
      // eslint-disable-next-line no-undef
      const erudaEl = document.getElementById('eruda');
      if (erudaEl) {
        // eslint-disable-next-line no-undef
        document.body.appendChild(erudaEl);
      }
    };

    showEruda();

    // Cleanup on unmount
    return () => {
      // eslint-disable-next-line no-undef
      const existingEruda = (window as any).__eruda;
      if (existingEruda) {
        existingEruda.hide();
      }
    };
  }, []);

  return (
    <div className="debug-console-page">
      <div className="debug-header">
        <Link to="/" className="back-button">
          <i className="fas fa-arrow-left"></i> Back to App
        </Link>
        <h1>Debug Console</h1>
      </div>
      <div id="eruda-container" className="eruda-container"></div>
    </div>
  );
};
