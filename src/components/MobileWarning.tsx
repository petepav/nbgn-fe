import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './TokenInfoExplainer/TokenInfoExplainer.module.css';

export const MobileWarning: React.FC = () => {
  const { t } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);
  // eslint-disable-next-line no-undef
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    const checkMobile = () => {
      // eslint-disable-next-line no-undef
      const userAgent = navigator.userAgent.toLowerCase();
      // eslint-disable-next-line no-undef
      const screenWidth = window.innerWidth;

      // Check if it's a mobile device based on screen width and user agent
      const isMobileDevice =
        screenWidth <= 768 ||
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent
        );

      // Check if it's MetaMask's built-in browser (not just extension)
      const isMetaMaskBrowser = userAgent.includes('metamask');

      // For testing: add a debug log
      // eslint-disable-next-line no-console, no-undef
      console.log('Mobile Detection:', {
        screenWidth,
        userAgent,
        isMobileDevice,
        isMetaMaskBrowser,
        willShowWarning: isMobileDevice && !isMetaMaskBrowser,
      });

      setShowWarning(isMobileDevice && !isMetaMaskBrowser);
    };

    checkMobile();
    // eslint-disable-next-line no-undef
    window.addEventListener('resize', checkMobile);

    // eslint-disable-next-line no-undef
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!showWarning) {
    return null;
  }

  return (
    <div className="mobile-warning">
      <div className="mobile-warning-content">
        <div className="mobile-warning-text">
          <i className="fas fa-mobile-alt mr-2"></i>
          <strong>Мобилно устройство</strong>
          <p>
            За да използвате платформата на мобилно устройство, моля отворете
            този сайт от <strong>вградения браузър на MetaMask</strong>
          </p>
          <a
            href={`https://metamask.app.link/dapp/${window.location.host}`}
            target="_blank"
            className={styles.addButton}
            style={{ margin: '15px' }}
          >
            {t('tokenInfo.openInMetaMask')}
          </a>
          <p className="mobile-warning-steps">
            1. Отворете MetaMask приложението
            <br />
            2. Натиснете иконата за браузър (долу в средата)
            <br />
            3. Въведете адреса на сайта - {currentUrl}
          </p>
        </div>
      </div>
    </div>
  );
};
