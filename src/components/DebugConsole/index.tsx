import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DebugConsole.css';

export const DebugConsole: React.FC = () => {
  useEffect(() => {
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

        // Add custom styling
        // eslint-disable-next-line no-undef
        const style = document.createElement('style');
        style.textContent = `
          #eruda {
            position: fixed !important;
            top: 60px !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            height: calc(100vh - 60px) !important;
            z-index: 9999 !important;
          }
          .eruda-entry-btn {
            display: none !important;
          }
        `;
        // eslint-disable-next-line no-undef
        document.head.appendChild(style);
      } catch (error) {
        // eslint-disable-next-line no-console, no-undef
        console.error('Failed to load Eruda:', error);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void loadEruda();

    // Cleanup on unmount
    return () => {
      // eslint-disable-next-line no-undef
      const erudaElement = document.getElementById('eruda');
      if (erudaElement) {
        erudaElement.remove();
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
