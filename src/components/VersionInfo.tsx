import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const VersionInfo: React.FC = () => {
  // eslint-disable-next-line no-undef
  const version = process.env.REACT_APP_VERSION || '0.1.0';
  // eslint-disable-next-line no-undef
  const buildDate =
    // eslint-disable-next-line no-undef
    process.env.REACT_APP_BUILD_DATE || new Date().toLocaleString('bg-BG');

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // eslint-disable-next-line no-undef
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    // eslint-disable-next-line no-undef
    window.addEventListener('resize', checkMobile);

    // eslint-disable-next-line no-undef
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="version-info">
      <p className="version-text">
        <i className="fas fa-code-branch mr-2"></i>
        Версия {version} • Билд от {buildDate}
        {isMobile && (
          <Link to="/debug" className="eruda-button">
            Eruda
          </Link>
        )}
      </p>
    </div>
  );
};
