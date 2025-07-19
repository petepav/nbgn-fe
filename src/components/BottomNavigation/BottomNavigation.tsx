import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './BottomNavigation.module.css';

interface BottomNavigationProps {
  activeWidget: 'send' | 'trade' | 'history' | 'voucher';
  // eslint-disable-next-line no-unused-vars
  onWidgetChange: (widget: 'send' | 'trade' | 'history' | 'voucher') => void;
  selectedToken: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeWidget,
  onWidgetChange,
  selectedToken,
}) => {
  const { t } = useTranslation();

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navContainer}>
        <button
          onClick={() => onWidgetChange('trade')}
          className={`${styles.navButton} ${activeWidget === 'trade' ? `${styles.active} ${styles.trade}` : ''}`}
          aria-label={t('web3:trade.title', 'Trade')}
        >
          <div className={styles.activeIndicator} />
          <div className={styles.iconWrapper}>
            <i className={`fas fa-exchange-alt ${styles.icon}`}></i>
          </div>
          <span className={styles.label}>{t('web3:trade.title', 'Trade')}</span>
        </button>

        <button
          onClick={() => onWidgetChange('send')}
          className={`${styles.navButton} ${activeWidget === 'send' ? `${styles.active} ${styles.send}` : ''}`}
          aria-label={t('web3:transaction.send', { token: selectedToken })}
        >
          <div className={styles.activeIndicator} />
          <div className={styles.iconWrapper}>
            <i className={`fas fa-paper-plane ${styles.icon}`}></i>
          </div>
          <span className={styles.label}>
            {t('web3:transaction.send', { token: selectedToken })}
          </span>
        </button>

        <button
          onClick={() => onWidgetChange('history')}
          className={`${styles.navButton} ${activeWidget === 'history' ? `${styles.active} ${styles.history}` : ''}`}
          aria-label={t('web3:transaction.historyShort', 'History')}
        >
          <div className={styles.activeIndicator} />
          <div className={styles.iconWrapper}>
            <i className={`fas fa-clock-rotate-left ${styles.icon}`}></i>
          </div>
          <span className={styles.label}>
            {t('web3:transaction.historyShort', 'History')}
          </span>
        </button>

        <button
          onClick={() => onWidgetChange('voucher')}
          className={`${styles.navButton} ${activeWidget === 'voucher' ? `${styles.active} ${styles.voucher}` : ''}`}
          aria-label={t('web3:voucher.title', 'Voucher')}
        >
          <div className={styles.activeIndicator} />
          <div className={styles.iconWrapper}>
            <i className={`fas fa-gift ${styles.icon}`}></i>
          </div>
          <span className={styles.label}>
            {t('web3:voucher.title', 'Voucher')}
          </span>
        </button>
      </div>
    </nav>
  );
};
