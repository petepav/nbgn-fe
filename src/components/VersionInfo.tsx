import React from 'react';

export const VersionInfo: React.FC = () => {
  // eslint-disable-next-line no-undef
  const version = process.env.REACT_APP_VERSION || '0.1.0';
  // eslint-disable-next-line no-undef
  const buildDate =
    process.env.REACT_APP_BUILD_DATE || new Date().toLocaleString('bg-BG');

  return (
    <div className="version-info">
      <p className="version-text">
        <i className="fas fa-code-branch mr-2"></i>
        Версия {version} • Билд от {buildDate}
      </p>
    </div>
  );
};
